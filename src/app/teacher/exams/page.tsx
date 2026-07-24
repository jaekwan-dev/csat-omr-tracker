"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };
const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(135deg,#667eea,#764ba2)",
  MATH: "linear-gradient(135deg,#f97316,#7c3aed)",
  ENGLISH: "linear-gradient(135deg,#06b6d4,#3b82f6)",
};
const SUBJECT_COLOR: Record<string, string> = { KOREAN: "#764ba2", MATH: "#f97316", ENGLISH: "#3b82f6" };

interface Question { questionNum: number; correctAnswer: number; score: number; isSubjective: boolean; }
interface Exam {
  id: number; subject: string; title: string;
  totalQuestions: number; startNum: number;
  questions: Question[];
  _count: { submissions: number };
}

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/teacher/exams");
    const d = await r.json();
    setExams(d.exams ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  async function handleDelete(exam: Exam) {
    if (!confirm(`"${exam.title}" 시험을 삭제하시겠습니까?\n제출된 ${exam._count.submissions}개의 답안도 함께 삭제됩니다.`)) return;
    setDeletingId(exam.id);
    const r = await fetch(`/api/teacher/exams/${exam.id}`, { method: "DELETE" });
    if (r.ok) await fetchExams();
    setDeletingId(null);
  }

  function startEdit(exam: Exam) {
    setEditingExam(exam);
    setEditQuestions(exam.questions.map((q) => ({ ...q })));
    setMsg("");
  }

  async function handleSaveEdit() {
    if (!editingExam) return;
    setSaving(true);
    const r = await fetch(`/api/teacher/exams/${editingExam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingExam.title, questions: editQuestions }),
    });
    setSaving(false);
    if (r.ok) {
      setMsg("✅ 저장되었습니다.");
      await fetchExams();
      setTimeout(() => { setEditingExam(null); setMsg(""); }, 1000);
    } else {
      setMsg("❌ 저장 실패");
    }
  }

  const grouped = (["ENGLISH", "MATH", "KOREAN"] as const).map((s) => ({
    subject: s, exams: exams.filter((e) => e.subject === s),
  }));

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>시험 관리</h1>
          <p style={styles.pageSubtitle}>시험을 등록하고 정답과 배점을 관리하세요.</p>
        </div>
        <Link href="/teacher/exams/new" className="btn btn-primary">
          + 새 시험 등록
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#0f766e", borderColor: "#e2e8f0", margin: "0 auto" }} />
        </div>
      )}

      {!loading && exams.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>등록된 시험이 없습니다</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>오른쪽 위 버튼으로 새 시험을 등록하세요.</div>
        </div>
      )}

      {/* Exam Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {grouped.map(({ subject, exams: list }) => {
          if (!list.length) return null;
          const color = SUBJECT_COLOR[subject];
          const gradient = SUBJECT_GRADIENT[subject];
          return (
            <div key={subject}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 22, borderRadius: 2, background: gradient }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {SUBJECT_LABEL[subject]}
                </h2>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>({list.length}개)</span>
              </div>
              <div style={styles.examGrid}>
                {list.map((exam) => (
                  <div key={exam.id} style={styles.examCard}>
                    {/* Card Top */}
                    <div style={{ ...styles.cardTop, background: gradient }}>
                      <div>
                        <div style={styles.cardSubjectEn}>{subject}</div>
                        <div style={styles.cardTitle}>{exam.title}</div>
                      </div>
                      <div style={styles.cardMeta}>
                        <div style={styles.cardChip}>{exam.totalQuestions}문항</div>
                        <div style={styles.cardChip}>{exam.startNum}번부터</div>
                      </div>
                    </div>
                    {/* Card Stats */}
                    <div style={styles.cardStats}>
                      <div style={styles.cardStat}>
                        <span style={styles.cardStatValue}>{exam._count.submissions}</span>
                        <span style={styles.cardStatLabel}>제출</span>
                      </div>
                      <div style={styles.cardStat}>
                        <span style={styles.cardStatValue}>
                          {exam.questions.reduce((s, q) => s + q.score, 0)}
                        </span>
                        <span style={styles.cardStatLabel}>만점</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => startEdit(exam)}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, color }}
                      >
                        ✏️ 정답 수정
                      </button>
                      <button
                        onClick={() => handleDelete(exam)}
                        disabled={deletingId === exam.id}
                        className="btn btn-sm"
                        style={{ flex: 1, background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca" }}
                      >
                        {deletingId === exam.id ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#dc2626", borderColor: "#fecaca" }} /> : "🗑 삭제"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingExam && (
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditingExam(null); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                {editingExam.title} — 정답 수정
              </h2>
              <button onClick={() => setEditingExam(null)} style={{ fontSize: 20, cursor: "pointer", background: "none", border: "none", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "60vh", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "#f8faff" }}>
                  <tr>
                    <th style={{ ...styles.editTh, width: 50 }}>번호</th>
                    {editingExam.subject === "MATH" && <th style={{ ...styles.editTh, width: 70 }}>유형</th>}
                    <th style={styles.editTh}>정답 입력</th>
                    <th style={{ ...styles.editTh, width: 70 }}>배점</th>
                  </tr>
                </thead>
                <tbody>
                  {editQuestions.map((q, i) => (
                    <tr key={q.questionNum} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={styles.editTd}>
                        <span style={{ fontWeight: 700, color: "#374151" }}>{q.questionNum}</span>
                      </td>
                      {editingExam.subject === "MATH" && (
                        <td style={styles.editTd}>
                          <button
                            type="button"
                            onClick={() => {
                              const nxt = [...editQuestions];
                              const isSubj = !nxt[i].isSubjective;
                              nxt[i] = {
                                ...nxt[i],
                                isSubjective: isSubj,
                                correctAnswer: isSubj ? 0 : 1,
                              };
                              setEditQuestions(nxt);
                            }}
                            style={{
                              padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                              cursor: "pointer", border: "1px solid #e2e8f0",
                              background: q.isSubjective ? "#f1f5f9" : "#fff",
                              color: q.isSubjective ? "#475569" : "#0f172a",
                            }}
                          >
                            {q.isSubjective ? "✏️ 단답" : "⭕ 객관"}
                          </button>
                        </td>
                      )}
                      <td style={styles.editTd}>
                        {q.isSubjective ? (
                          <input
                            type="number" min={0} max={999}
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const nxt = [...editQuestions];
                              nxt[i] = { ...nxt[i], correctAnswer: Number(e.target.value) };
                              setEditQuestions(nxt);
                            }}
                            style={{
                              width: 80, padding: "8px 12px",
                              borderRadius: 10, border: "2px solid #e2e8f0",
                              fontSize: 14, fontWeight: 800, textAlign: "center",
                              fontFamily: "inherit", color: "#0f172a",
                              background: "#f8fafc",
                            }}
                            placeholder="정답"
                          />
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            {[1, 2, 3, 4, 5].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  const nxt = [...editQuestions];
                                  nxt[i] = { ...nxt[i], correctAnswer: c };
                                  setEditQuestions(nxt);
                                }}
                                style={{
                                  width: 34, height: 34, borderRadius: "50%", fontSize: 13, fontWeight: 700,
                                  border: q.correctAnswer === c ? "none" : "1.5px solid #e2e8f0",
                                  background: q.correctAnswer === c ? SUBJECT_COLOR[editingExam.subject] : "#fff",
                                  color: q.correctAnswer === c ? "#fff" : "#475569",
                                  cursor: "pointer", transition: "all 0.12s",
                                }}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={styles.editTd}>
                        <input
                          type="number" min={1} max={10}
                          value={q.score}
                          onChange={(e) => {
                            const nxt = [...editQuestions];
                            nxt[i] = { ...nxt[i], score: Number(e.target.value) };
                            setEditQuestions(nxt);
                          }}
                          style={{ width: 60, padding: "6px 8px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "inherit" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {msg && <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: msg.startsWith("✅") ? "#10b981" : "#dc2626" }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditingExam(null)} className="btn btn-ghost" style={{ flex: 1 }}>취소</button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 2, background: SUBJECT_GRADIENT[editingExam.subject], boxShadow: `0 4px 14px ${SUBJECT_COLOR[editingExam.subject]}44` }}
              >
                {saving ? <><span className="spinner" />저장 중...</> : "💾 저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 },
  pageTitle: { fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  examGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 },
  examCard: { background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" },
  cardTop: { padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardSubjectEn: { fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" },
  cardMeta: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" },
  cardChip: { background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999 },
  cardStats: { display: "flex", padding: "14px 20px", gap: 20, borderBottom: "1px solid #f1f5f9" },
  cardStat: { display: "flex", flexDirection: "column", gap: 2 },
  cardStatValue: { fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1 },
  cardStatLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },
  cardActions: { padding: "14px 16px", display: "flex", gap: 8 },
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    background: "#fff", borderRadius: 24, padding: "32px 28px",
    width: "100%", maxWidth: 540,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "scaleIn 0.2s ease",
  },
  editTh: { padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#475569", textAlign: "left" },
  editTd: { padding: "10px 12px" },
};
