"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };
const SUBJECT_EMOJI: Record<string, string> = { KOREAN: "📚", MATH: "✏️", ENGLISH: "💡" };
const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(135deg,#667eea,#764ba2)",
  MATH: "linear-gradient(135deg,#f97316,#7c3aed)",
  ENGLISH: "linear-gradient(135deg,#06b6d4,#3b82f6)",
};
const SUBJECT_COLOR: Record<string, string> = { KOREAN: "#764ba2", MATH: "#7c3aed", ENGLISH: "#3b82f6" };

interface Question { questionNum: number; correctAnswer: number; score: number; isSubjective: boolean; }
interface Exam {
  id: number; subject: string; title: string;
  totalQuestions: number; startNum: number;
  explanationPdfUrl?: string | null;
  questions: Question[];
  _count: { submissions: number };
}

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("KOREAN");
  const [searchQuery, setSearchQuery] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [editExplanationFile, setEditExplanationFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/teacher/exams");
      const text = await r.text();
      let d;
      try {
        d = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        setExams([]);
        return;
      }
      if (r.ok) {
        setExams(d.exams ?? []);
      } else {
        console.error(d.error);
        setExams([]);
      }
    } catch (e) {
      console.error(e);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSubject = e.subject === selectedSubjectFilter;
      const matchSearch = e.title.includes(searchQuery) || SUBJECT_LABEL[e.subject]?.includes(searchQuery);
      return matchSubject && matchSearch;
    });
  }, [exams, selectedSubjectFilter, searchQuery]);

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
    setEditExplanationFile(null);
    setMsg("");
  }

  async function handleSaveEdit() {
    if (!editingExam) return;
    setSaving(true);
    let explanationPdfUrl = editingExam.explanationPdfUrl;

    if (editExplanationFile) {
      try {
        const formData = new FormData();
        formData.append("file", editExplanationFile);
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(editExplanationFile.name)}`, {
          method: "POST",
          body: editExplanationFile,
        });
        if (!uploadRes.ok) throw new Error("업로드 실패");
        const uploadData = await uploadRes.json();
        explanationPdfUrl = uploadData.url;
      } catch (err: any) {
        setMsg("❌ " + (err.message || "해설지 업로드 실패"));
        setSaving(false);
        return;
      }
    }

    const r = await fetch(`/api/teacher/exams/${editingExam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingExam.title, explanationPdfUrl, questions: editQuestions }),
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

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 80 }}>
      {/* Header Row */}
      <div style={styles.pageHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={styles.pageTitle}>시험 관리</h1>
            <span style={styles.countBadge}>{exams.length}개 시험</span>
          </div>
        </div>
        <Link href="/teacher/exams/new" className="btn btn-primary" style={styles.createBtn}>
          <span>➕</span>
          <span>새 시험 등록</span>
        </Link>
      </div>

      {/* Top Filter Bar (스크롤 0% 3열 과목 그리드 & 검색) */}
      <div style={styles.filterControlCard}>
        {/* 과목 선택 3열 균등 그리드 */}
        <div style={styles.subjectFilterGrid}>
          {[
            { id: "KOREAN", label: "국어", emoji: "📚", count: exams.filter(e => e.subject === "KOREAN").length },
            { id: "MATH", label: "수학", emoji: "✏️", count: exams.filter(e => e.subject === "MATH").length },
            { id: "ENGLISH", label: "영어", emoji: "💡", count: exams.filter(e => e.subject === "ENGLISH").length },
          ].map((tab) => {
            const isActive = selectedSubjectFilter === tab.id;
            const activeColor = SUBJECT_COLOR[tab.id] || "#0f766e";
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSubjectFilter(tab.id)}
                style={{
                  ...styles.subjectGridBtn,
                  background: isActive ? activeColor : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                  borderColor: isActive ? activeColor : "#cbd5e1",
                  fontWeight: isActive ? 900 : 700,
                  boxShadow: isActive ? `0 4px 12px ${activeColor}33` : "none",
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.emoji}</span>
                <span style={{ fontSize: 14 }}>{tab.label}</span>
                <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 2 }}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* 검색 입력창 */}
        <div style={styles.searchBox}>
          <span style={{ fontSize: 16, color: "#94a3b8" }}>🔍</span>
          <input
            type="text"
            placeholder={`${SUBJECT_LABEL[selectedSubjectFilter]} 시험 제목 검색...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading / Empty States */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#0f766e", borderColor: "#e2e8f0", margin: "0 auto" }} />
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>시험 목록을 불러오는 중...</div>
        </div>
      )}

      {!loading && filteredExams.length === 0 && (
        <div style={styles.emptyBox}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>등록된 시험이 없습니다</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {searchQuery ? "검색 조건에 일치하는 시험이 없습니다." : "상단의 '새 시험 등록' 버튼을 눌러 시험을 추가하세요."}
          </div>
        </div>
      )}

      {/* Compact Exam List View */}
      {!loading && filteredExams.length > 0 && (
        <div style={styles.listContainer}>
          {filteredExams.map((exam) => {
            const color = SUBJECT_COLOR[exam.subject] || "#0f766e";
            const emoji = SUBJECT_EMOJI[exam.subject] || "📝";
            const totalMaxScore = exam.questions.reduce((s, q) => s + q.score, 0);

            return (
              <div key={exam.id} style={styles.examListItem}>
                {/* Subject Tag */}
                <div style={{ ...styles.subjectTag, background: `${color}15`, color }}>
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <span>{SUBJECT_LABEL[exam.subject]}</span>
                </div>

                {/* Exam Info Title & Detail */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={styles.examItemTitle}>{exam.title}</div>
                  {/* <div style={styles.examItemMeta}>
                    <span>{exam.totalQuestions}문항 ({exam.startNum}번부터)</span>
                    <span>·</span>
                    <span style={{ fontWeight: 700, color: "#334155" }}>만점: {totalMaxScore}점</span>
                  </div> */}
                </div>

                {/* Submissions Badge */}
                {/* <div style={styles.submissionCountChip}>
                  <span>📝</span>
                  <span>제출 <strong>{exam._count.submissions}</strong>건</span>
                </div> */}

                {/* Action Buttons */}
                <div style={styles.itemActionGroup}>
                  <button onClick={() => startEdit(exam)} style={{ ...styles.editBtn, color }}>
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleDelete(exam)}
                    disabled={deletingId === exam.id}
                    style={styles.deleteBtn}
                  >
                    {deletingId === exam.id ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#dc2626", borderColor: "#fecaca" }} /> : "🗑️ 삭제"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingExam && (
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditingExam(null); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                  {editingExam.title} — 정답 및 배점 수정
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {SUBJECT_LABEL[editingExam.subject]} · 총 {editingExam.totalQuestions}문항
                </div>
              </div>
              <button onClick={() => setEditingExam(null)} style={{ fontSize: 18, cursor: "pointer", background: "none", border: "none", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                해설지 PDF 업로드 (새 파일 선택 시 교체됨)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setEditExplanationFile(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
              />
              {editingExam.explanationPdfUrl && !editExplanationFile && (
                <div style={{ fontSize: 12, color: "#0f766e", marginTop: 4 }}>
                  현재 등록된 해설지가 있습니다.
                </div>
              )}
            </div>

            <div style={{ overflowY: "auto", maxHeight: "60vh", marginBottom: 20, borderRadius: 14, border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "#f8faff", zIndex: 10 }}>
                  <tr>
                    <th style={{ ...styles.editTh, width: 50 }}>번호</th>
                    <th style={styles.editTh}>정답 입력</th>
                    <th style={{ ...styles.editTh, width: 70 }}>배점</th>
                  </tr>
                </thead>
                <tbody>
                  {editQuestions.map((q, i) => (
                    <tr key={q.questionNum} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={styles.editTd}>
                        <span style={{ fontWeight: 800, color: "#374151" }}>{q.questionNum}</span>
                      </td>
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
                              width: 80, padding: "6px 10px",
                              borderRadius: 8, border: "1.5px solid #cbd5e1",
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
                                  width: 32, height: 32, borderRadius: "50%", fontSize: 13, fontWeight: 700,
                                  border: q.correctAnswer === c ? "none" : "1.5px solid #cbd5e1",
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
                          style={{ width: 54, padding: "6px 8px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "inherit" }}
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
                {saving ? <><span className="spinner" />저장 중...</> : "💾 저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  countBadge: { background: "#ccfbf1", color: "#0f766e", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999 },
  createBtn: { background: "linear-gradient(135deg, #0f766e, #0891b2)", color: "#fff", boxShadow: "0 4px 14px rgba(8,145,178,0.3)", padding: "10px 18px", borderRadius: 14, fontSize: 14 },

  filterControlCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  subjectFilterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  subjectGridBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 8px",
    borderRadius: 14,
    cursor: "pointer",
    border: "1.5px solid #cbd5e1",
    transition: "all 0.15s",
    textAlign: "center",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f8fafc",
    borderRadius: 14,
    padding: "8px 14px",
    border: "1px solid #cbd5e1",
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    outline: "none",
    color: "#0f172a",
  },
  clearBtn: {
    fontSize: 13,
    color: "#94a3b8",
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  emptyBox: {
    background: "#fff",
    borderRadius: 20,
    padding: "50px 20px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },

  /* Compact List View */
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  examListItem: {
    background: "#ffffff",
    borderRadius: 18,
    padding: "14px 18px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    transition: "all 0.15s ease",
  },
  subjectTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 900,
    flexShrink: 0,
  },
  examItemTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  examItemMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
  },
  submissionCountChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#f0fdfa",
    color: "#0f766e",
    border: "1px solid #99f6e4",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 999,
    flexShrink: 0,
  },
  itemActionGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%", // Take full width to form a bottom row
    marginTop: 2,  // Add spacing from the top content
  },
  editBtn: {
    flex: 1, // Take half width
    padding: "10px",
    borderRadius: 12,
    background: "#f1f5f9",
    fontWeight: 800,
    fontSize: 13,
    textAlign: "center",
    cursor: "pointer",
    border: "1px solid #cbd5e1",
    transition: "all 0.15s",
  },
  deleteBtn: {
    flex: 1, // Take half width
    padding: "10px",
    borderRadius: 12,
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 800,
    fontSize: 13,
    textAlign: "center",
    cursor: "pointer",
    border: "1px solid #fecaca",
    transition: "all 0.15s",
  },

  /* Edit Modal */
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    background: "#fff", borderRadius: 24, padding: "28px 24px",
    width: "100%", maxWidth: 520,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "scaleIn 0.2s ease",
  },
  editTh: { padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#475569", textAlign: "left" },
  editTd: { padding: "10px 12px" },
};
