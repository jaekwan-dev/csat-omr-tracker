"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

/* ── Subject configuration ───────────────────────────────────────────── */

interface SubjectConfig {
  label: string;
  totalQuestions: number;
  minQuestions: number;
  startNum: number;
  scoreOptions: number[];
  fixedTotal: number | null;
  canDeleteQuestions: boolean;
}

const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  KOREAN: {
    label: "국어",
    totalQuestions: 25,
    minQuestions: 15,
    startNum: 1,
    scoreOptions: [4, 5, 6, 7],
    fixedTotal: 100,
    canDeleteQuestions: true,
  },
  MATH: {
    label: "수학",
    totalQuestions: 20,
    minQuestions: 20,
    startNum: 1,
    scoreOptions: [2, 3, 4],
    fixedTotal: null,
    canDeleteQuestions: false,
  },
  ENGLISH: {
    label: "영어",
    totalQuestions: 28,
    minQuestions: 28,
    startNum: 18,
    scoreOptions: [2, 3],
    fixedTotal: 63,
    canDeleteQuestions: false,
  },
};

const SUBJECT_COLOR: Record<string, string> = { KOREAN: "#764ba2", MATH: "#f97316", ENGLISH: "#3b82f6" };
const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(135deg,#667eea,#764ba2)",
  MATH: "linear-gradient(135deg,#f97316,#7c3aed)",
  ENGLISH: "linear-gradient(135deg,#06b6d4,#3b82f6)",
};

/* ── Types ───────────────────────────────────────────────────────────── */

interface QuestionInput {
  questionNum: number;
  correctAnswer: number;
  score: number;
  isSubjective: boolean;
}

function buildQuestions(subject: string): QuestionInput[] {
  const cfg = SUBJECT_CONFIG[subject];
  if (!cfg) return [];
  return Array.from({ length: cfg.totalQuestions }, (_, i) => ({
    questionNum: cfg.startNum + i,
    correctAnswer: 1,
    score: cfg.scoreOptions[0],
    isSubjective: false,
  }));
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function NewExamPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>("ENGLISH");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>(() => buildQuestions("ENGLISH"));
  const [explanationFile, setExplanationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cfg = SUBJECT_CONFIG[subject];

  useEffect(() => {
    setQuestions(buildQuestions(subject));
  }, [subject]);

  /* ── Question helpers ─────────────────────────────────────────────── */

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
        correctAnswer: isSubj ? 0 : 1,
      };
      return n;
    });
  }

  /* ── 국어: 문항 삭제 / 복원 ─────────────────────────────────────── */

  function removeQuestion(idx: number) {
    setQuestions((prev) => {
      if (prev.length <= cfg.minQuestions) return prev;
      const n = [...prev];
      n.splice(idx, 1);
      return n.map((q, i) => ({ ...q, questionNum: cfg.startNum + i }));
    });
  }

  function addQuestion() {
    setQuestions((prev) => {
      if (prev.length >= cfg.totalQuestions) return prev;
      const nextNum = cfg.startNum + prev.length;
      return [...prev, {
        questionNum: nextNum,
        correctAnswer: 1,
        score: cfg.scoreOptions[0],
        isSubjective: false,
      }];
    });
  }

  /* ── Computed values ──────────────────────────────────────────────── */

  const maxScore = useMemo(() => questions.reduce((s, q) => s + q.score, 0), [questions]);
  const color = SUBJECT_COLOR[subject];
  const gradient = SUBJECT_GRADIENT[subject];

  const totalScoreLabel = cfg.fixedTotal
    ? `${cfg.fixedTotal}점 만점`
    : null;

  const totalMismatch = cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal;

  /* ── Submit ───────────────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("시험 제목을 입력하세요."); return; }
    if (questions.some((q) => !q.isSubjective && (q.correctAnswer < 1 || q.correctAnswer > 5))) {
      setError("객관식 문항의 정답을 1~5 사이로 입력하세요."); return;
    }
    if (questions.some((q) => q.isSubjective && (q.correctAnswer < 0 || q.correctAnswer > 999))) {
      setError("주관식 문항의 정답은 0~999 사이로 입력하세요."); return;
    }
    if (questions.some((q) => !cfg.scoreOptions.includes(q.score))) {
      setError(`배점은 ${cfg.scoreOptions.join(", ")}점만 가능합니다.`); return;
    }
    if (cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal) {
      setError(`총 배점 합계가 ${cfg.fixedTotal}점이 되어야 합니다. (현재 ${maxScore}점)`); return;
    }
    setError("");
    setSubmitting(true);
    let explanationPdfUrl: string | undefined;

    try {
      if (explanationFile) {
        const formData = new FormData();
        formData.append("file", explanationFile);
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(explanationFile.name)}`, {
          method: "POST",
          body: explanationFile,
        });
        if (!uploadRes.ok) throw new Error("해설지 업로드 실패");
        const uploadData = await uploadRes.json();
        explanationPdfUrl = uploadData.url;
      }
    } catch (err: any) {
      setError(err.message || "업로드 오류가 발생했습니다.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, title: title.trim(), startNum: cfg.startNum, explanationPdfUrl, questions }),
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

  /* ── Score pill button renderer ───────────────────────────────────── */

  function renderScorePills(questionIdx: number, currentScore: number) {
    return (
      <div style={{ display: "flex", gap: 3 }}>
        {cfg.scoreOptions.map((s) => {
          const isSelected = currentScore === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setScore(questionIdx, s)}
              style={{
                minWidth: 32, height: 28,
                padding: "0 6px",
                borderRadius: 8,
                border: isSelected ? "none" : "1.5px solid #e2e8f0",
                background: isSelected ? color : "#fff",
                color: isSelected ? "#fff" : "#64748b",
                fontWeight: 700, fontSize: 12,
                cursor: "pointer",
                transition: "all 0.12s",
                boxShadow: isSelected ? `0 2px 6px ${color}44` : "none",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 720, paddingLeft: 16, paddingRight: 16 }}>
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
                {Object.entries(SUBJECT_CONFIG).map(([s, c]) => (
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
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Info Banner */}
            <div style={{
              background: `${color}0a`,
              border: `1.5px solid ${color}22`,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.7,
            }}>
              <div>📋 <strong>{cfg.label}</strong> 설정</div>
              <div>• 문항 수: {cfg.canDeleteQuestions ? `${cfg.minQuestions}~${cfg.totalQuestions}문항 (삭제 가능)` : `${cfg.totalQuestions}문항 (고정)`}</div>
              <div>• 배점: {cfg.scoreOptions.join(", ")}점</div>
              {cfg.fixedTotal && <div>• 만점: {cfg.fixedTotal}점</div>}
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

            {/* Explanation PDF */}
            <div>
              <label className="label" htmlFor="explanationFile">해설지 PDF 업로드 (선택)</label>
              <input
                id="explanationFile"
                className="input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setExplanationFile(e.target.files?.[0] || null)}
              />
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                학생들이 시험 제출 후 다운로드할 수 있는 해설지(PDF)를 업로드합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 0 }}>문항별 정답 및 배점</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>전체 배점:</span>
              {cfg.scoreOptions.map((s) => (
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
            </div>
          </div>

          {/* Score summary bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", marginBottom: 14,
            background: totalMismatch ? "#fef2f2" : `${color}08`,
            border: `1.5px solid ${totalMismatch ? "#fecaca" : `${color}18`}`,
            borderRadius: 10,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 800,
              color: totalMismatch ? "#dc2626" : color,
            }}>
              합계 {maxScore}점
            </span>
            {totalScoreLabel && (
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: totalMismatch ? "#dc2626" : "#64748b",
              }}>
                {totalMismatch
                  ? `${maxScore > cfg.fixedTotal! ? `${maxScore - cfg.fixedTotal!}점 초과` : `${cfg.fixedTotal! - maxScore}점 부족`} (목표 ${cfg.fixedTotal}점)`
                  : `✓ ${totalScoreLabel}`
                }
              </span>
            )}
          </div>

          {/* 국어: 문항 추가/삭제 컨트롤 */}
          {cfg.canDeleteQuestions && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              marginBottom: 14, padding: "10px 14px",
              background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0",
            }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                현재 {questions.length}문항
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                (최소 {cfg.minQuestions} ~ 최대 {cfg.totalQuestions})
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= cfg.totalQuestions}
                  style={{
                    ...styles.countBtn,
                    background: questions.length >= cfg.totalQuestions ? "#e2e8f0" : `${color}15`,
                    color: questions.length >= cfg.totalQuestions ? "#94a3b8" : color,
                    cursor: questions.length >= cfg.totalQuestions ? "not-allowed" : "pointer",
                  }}
                >
                  + 추가
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(questions.length - 1)}
                  disabled={questions.length <= cfg.minQuestions}
                  style={{
                    ...styles.countBtn,
                    background: questions.length <= cfg.minQuestions ? "#e2e8f0" : "#fef2f2",
                    color: questions.length <= cfg.minQuestions ? "#94a3b8" : "#ef4444",
                    cursor: questions.length <= cfg.minQuestions ? "not-allowed" : "pointer",
                  }}
                >
                  − 삭제
                </button>
              </div>
            </div>
          )}

          {/* Question list - card style for mobile */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => (
              <div
                key={q.questionNum}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px",
                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #f1f5f9",
                }}
              >
                {/* Question number */}
                <span style={{
                  minWidth: 28, height: 28,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8,
                  background: `${color}12`,
                  color: color,
                  fontWeight: 800, fontSize: 13,
                  flexShrink: 0,
                }}>
                  {q.questionNum}
                </span>

                {/* Answer selection */}
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  {q.isSubjective ? (
                    <input
                      type="number" min={0} max={999}
                      value={q.correctAnswer}
                      onChange={(e) => setAnswer(i, Number(e.target.value))}
                      style={{
                        width: 64, padding: "6px 8px",
                        borderRadius: 8, border: "2px solid #e2e8f0",
                        fontSize: 13, fontWeight: 800, textAlign: "center",
                        fontFamily: "inherit", color: "#0f172a",
                        background: "#f8fafc",
                      }}
                      placeholder="정답"
                    />
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAnswer(i, c)}
                          style={{
                            width: 30, height: 30, borderRadius: "50%",
                            border: q.correctAnswer === c ? "none" : "1.5px solid #e2e8f0",
                            background: q.correctAnswer === c ? color : "#fff",
                            color: q.correctAnswer === c ? "#fff" : "#64748b",
                            fontWeight: 700, fontSize: 13,
                            cursor: "pointer", transition: "all 0.12s",
                            boxShadow: q.correctAnswer === c ? `0 2px 6px ${color}44` : "none",
                            transform: q.correctAnswer === c ? "scale(1.08)" : "scale(1)",
                            padding: 0,
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score pill buttons */}
                <div style={{ flexShrink: 0 }}>
                  {renderScorePills(i, q.score)}
                </div>

                {/* Delete button (국어 only) */}
                {cfg.canDeleteQuestions && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= cfg.minQuestions}
                    title="문항 삭제"
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: "none", fontSize: 12,
                      background: questions.length <= cfg.minQuestions ? "transparent" : "#fef2f2",
                      color: questions.length <= cfg.minQuestions ? "#cbd5e1" : "#ef4444",
                      cursor: questions.length <= cfg.minQuestions ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, padding: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total score warning */}
          {totalMismatch && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, fontSize: 13, color: "#dc2626",
              fontWeight: 600,
            }}>
              ⚠️ 배점 합계가 {cfg.fixedTotal}점이 되어야 합니다. (현재 {maxScore}점, {maxScore > cfg.fixedTotal! ? `${maxScore - cfg.fixedTotal!}점 초과` : `${cfg.fixedTotal! - maxScore}점 부족`})
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <button
          type="submit"
          disabled={submitting || !title || totalMismatch}
          className="btn btn-primary btn-lg btn-full"
          style={{
            background: totalMismatch ? "#94a3b8" : gradient,
            boxShadow: totalMismatch ? "none" : `0 4px 20px ${color}44`,
          }}
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
  pageSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  card: { background: "#fff", borderRadius: 20, padding: "20px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  cardTitle: { fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 16 },
  subjectBtn: { padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  countBtn: { padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", transition: "all 0.15s", fontFamily: "inherit" },
};
