"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SUBJECT_DEFAULTS: Record<string, { totalQuestions: number; startNum: number; label: string }> = {
  KOREAN: { totalQuestions: 30, startNum: 1, label: "국어 (1~30번, 30문항)" },
  MATH: { totalQuestions: 20, startNum: 1, label: "수학 (1~20번, 20문항)" },
  ENGLISH: { totalQuestions: 28, startNum: 18, label: "영어 (18~45번, 28문항)" },
};

const SUBJECT_COLOR: Record<string, string> = { KOREAN: "#764ba2", MATH: "#f97316", ENGLISH: "#3b82f6" };
const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(135deg,#667eea,#764ba2)",
  MATH: "linear-gradient(135deg,#f97316,#7c3aed)",
  ENGLISH: "linear-gradient(135deg,#06b6d4,#3b82f6)",
};

interface QuestionInput { questionNum: number; correctAnswer: number; score: number; isSubjective: boolean; }

function buildQuestions(subject: string): QuestionInput[] {
  const def = SUBJECT_DEFAULTS[subject];
  if (!def) return [];
  return Array.from({ length: def.totalQuestions }, (_, i) => ({
    questionNum: def.startNum + i,
    correctAnswer: 1,
    score: 2,
    isSubjective: false,
  }));
}

export default function NewExamPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>("ENGLISH");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>(() => buildQuestions("ENGLISH"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset questions when subject changes
  useEffect(() => {
    setQuestions(buildQuestions(subject));
  }, [subject]);

  function setAnswer(idx: number, answer: number) {
    setQuestions((prev) => {
      const n = [...prev];
      n[idx] = { ...n[idx], correctAnswer: answer };
      return n;
    });
  }
  function setScore(idx: number, score: number) {
    setQuestions((prev) => {
      const n = [...prev];
      n[idx] = { ...n[idx], score };
      return n;
    });
  }

  // Fill all scores at once
  function fillAllScores(score: number) {
    setQuestions((prev) => prev.map((q) => ({ ...q, score })));
  }

  function toggleSubjective(idx: number) {
    setQuestions((prev) => {
      const n = [...prev];
      const isSubj = !n[idx].isSubjective;
      n[idx] = { 
        ...n[idx], 
        isSubjective: isSubj,
        correctAnswer: isSubj ? 0 : 1 // 주관식이면 0으로, 객관식이면 1로 초기화
      };
      return n;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("시험 제목을 입력하세요."); return; }
    if (questions.some((q) => !q.isSubjective && (q.correctAnswer < 1 || q.correctAnswer > 5))) {
      setError("객관식 문항의 정답을 1~5 사이로 입력하세요."); return;
    }
    if (questions.some((q) => q.isSubjective && (q.correctAnswer < 0 || q.correctAnswer > 999))) {
      setError("주관식 문항의 정답은 0~999 사이로 입력하세요."); return;
    }
    setError("");
    setSubmitting(true);
    const def = SUBJECT_DEFAULTS[subject];
    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, title: title.trim(), startNum: def.startNum, questions }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "오류가 발생했습니다.");
    } else {
      router.push("/teacher/exams");
      router.refresh();
    }
  }

  const color = SUBJECT_COLOR[subject];
  const gradient = SUBJECT_GRADIENT[subject];
  const maxScore = questions.reduce((s, q) => s + q.score, 0);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 720 }}>
      <div style={styles.pageHeader}>
        <button onClick={() => router.push("/teacher/exams")} className="btn btn-ghost btn-sm">← 돌아가기</button>
      </div>

      <h1 style={styles.pageTitle}>새 시험 등록</h1>
      <p style={styles.pageSubtitle}>시험 정보와 각 문항의 정답 및 배점을 입력하세요.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Basic Info */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>기본 정보</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Subject Selector */}
            <div>
              <label className="label">과목 선택</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(SUBJECT_DEFAULTS).map(([s, def]) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    style={{
                      ...styles.subjectBtn,
                      background: subject === s ? SUBJECT_GRADIENT[s] : "#f8faff",
                      color: subject === s ? "#fff" : "#475569",
                      border: subject === s ? "none" : "1.5px solid #e2e8f0",
                      boxShadow: subject === s ? `0 4px 14px ${SUBJECT_COLOR[s]}44` : "none",
                    }}
                  >
                    {def.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label" htmlFor="examTitle">시험 제목</label>
              <input
                id="examTitle"
                className="input"
                type="text"
                placeholder="예: 2024년 6월 기출"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                회차, 날짜, 기출명 등을 자유롭게 입력하세요.
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={styles.cardTitle}>문항별 정답 및 배점</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>전체 배점:</span>
              {[2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => fillAllScores(s)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, color }}
                >
                  전체 {s}점
                </button>
              ))}
              <span style={{ fontSize: 13, fontWeight: 800, color }}>합계 {maxScore}점</span>
            </div>
          </div>

          <div style={styles.qTableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: gradient }}>
                <tr>
                  <th style={{ ...styles.th, color: "#fff", width: 60 }}>번호</th>
                  {subject === "MATH" && <th style={{ ...styles.th, color: "#fff", width: 80 }}>유형</th>}
                  <th style={{ ...styles.th, color: "#fff" }}>정답 입력</th>
                  <th style={{ ...styles.th, color: "#fff", width: 80 }}>배점</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.questionNum} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#374151", width: 60 }}>
                      {q.questionNum}
                    </td>
                    {subject === "MATH" && (
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={() => toggleSubjective(i)}
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
                    <td style={styles.td}>
                      {q.isSubjective ? (
                        <input
                          type="number" min={0} max={999}
                          value={q.correctAnswer}
                          onChange={(e) => setAnswer(i, Number(e.target.value))}
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
                              type="button"
                              onClick={() => setAnswer(i, c)}
                              style={{
                                width: 36, height: 36, borderRadius: "50%",
                                border: q.correctAnswer === c ? "none" : "1.5px solid #e2e8f0",
                                background: q.correctAnswer === c ? color : "#fff",
                                color: q.correctAnswer === c ? "#fff" : "#64748b",
                                fontWeight: 700, fontSize: 14,
                                cursor: "pointer", transition: "all 0.12s",
                                boxShadow: q.correctAnswer === c ? `0 2px 8px ${color}55` : "none",
                                transform: q.correctAnswer === c ? "scale(1.1)" : "scale(1)",
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number" min={1} max={10}
                        value={q.score}
                        onChange={(e) => setScore(i, Number(e.target.value))}
                        style={{
                          width: 56, padding: "7px 8px",
                          borderRadius: 10, border: "1.5px solid #e2e8f0",
                          fontSize: 14, fontWeight: 700, textAlign: "center",
                          fontFamily: "inherit", color: "#0f172a",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <button
          type="submit"
          disabled={submitting || !title}
          className="btn btn-primary btn-lg btn-full"
          style={{ background: gradient, boxShadow: `0 4px 20px ${color}44` }}
        >
          {submitting ? <><span className="spinner" />등록 중...</> : "📝 시험 등록하기"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { marginBottom: 12 },
  pageTitle: { fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 28 },
  card: { background: "#fff", borderRadius: 20, padding: "24px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  cardTitle: { fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 16 },
  subjectBtn: { padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  qTableWrap: { borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" },
  th: { padding: "12px 14px", fontSize: 12, fontWeight: 700, textAlign: "left", letterSpacing: "0.04em" },
  td: { padding: "10px 14px", verticalAlign: "middle" },
};
