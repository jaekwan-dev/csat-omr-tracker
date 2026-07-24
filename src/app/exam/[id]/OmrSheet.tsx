"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";

interface Question {
  questionNum: number;
  score: number;
  isSubjective: boolean;
}

interface Exam {
  id: number;
  subject: string;
  title: string;
  totalQuestions: number;
  startNum: number;
  questions: Question[];
}

interface OmrSheetProps {
  exam: Exam;
  student: SessionUser;
}

const SUBJECT_LABEL: Record<string, string> = {
  KOREAN: "국어",
  MATH: "수학",
  ENGLISH: "영어",
};

const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)",
  MATH: "linear-gradient(145deg, #f97316 0%, #7c3aed 100%)",
  ENGLISH: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)",
};

const SUBJECT_COLOR: Record<string, string> = {
  KOREAN: "#764ba2",
  MATH: "#7c3aed",
  ENGLISH: "#3b82f6",
};

export default function OmrSheet({ exam, student }: OmrSheetProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);

  const color = SUBJECT_COLOR[exam.subject] ?? "#3b82f6";
  const gradient = SUBJECT_GRADIENT[exam.subject] ?? SUBJECT_GRADIENT.ENGLISH;
  const markedCount = Object.keys(answers).length;
  const totalCount = exam.questions.length;
  const progress = totalCount > 0 ? (markedCount / totalCount) * 100 : 0;
  const unansweredNums = exam.questions
    .filter((q) => !answers[q.questionNum])
    .map((q) => q.questionNum);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const selectAnswer = useCallback((questionNum: number, choice: number) => {
    setAnswers((prev) => {
      if (prev[questionNum] === choice) {
        const next = { ...prev };
        delete next[questionNum];
        return next;
      }
      return { ...prev, [questionNum]: choice };
    });
    setWarning("");
  }, []);

  async function handleSubmit() {
    if (unansweredNums.length > 0) {
      setWarning(
        `미마킹 문항 ${unansweredNums.length}개: ${unansweredNums.join(", ")}번`
      );
      return;
    }
    await doSubmit();
  }

  async function doSubmit() {
    setSubmitting(true);
    setWarning("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWarning(data.error ?? "제출 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }
      router.push(`/result/${data.submissionId}`);
    } catch {
      setWarning("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={{ ...styles.header, background: gradient }}>
        <div className="container" style={styles.headerInner}>
          <button
            onClick={() => router.push("/")}
            style={styles.backBtn}
            className="btn btn-white btn-sm"
          >
            ← 뒤로
          </button>
          <div style={styles.headerCenter}>
            <div style={styles.headerSubject}>
              {SUBJECT_LABEL[exam.subject] ?? exam.subject}
            </div>
            <div style={styles.headerTitle}>
              {SUBJECT_LABEL[exam.subject] ?? exam.subject} 회차 선택 및 마킹
            </div>
          </div>
          <div style={styles.timerBox}>
            <span style={styles.timerIcon}>⏱</span>
            <span style={styles.timerText}>{formatTime(elapsedSec)}</span>
          </div>
        </div>

        {/* Progress */}
        <div style={styles.progressWrap}>
          <div style={styles.progressBg}>
            <div
              style={{
                ...styles.progressFg,
                width: `${progress}%`,
              }}
            />
          </div>
          <span style={styles.progressLabel}>
            {markedCount} / {totalCount} 마킹
          </span>
        </div>
      </header>

      {/* Exam Info Strip */}
      <div style={styles.infoStrip}>
        <div className="container" style={styles.infoInner}>
          <div style={styles.infoBadge}>
            <span style={{ ...styles.infoDot, background: color }} />
            {exam.title}
          </div>
          <div style={styles.infoDetail}>
            {exam.startNum}번 ~ {exam.startNum + exam.totalQuestions - 1}번 · {totalCount}문항
          </div>
          <div style={styles.studentChip}>
            {student.name} ({student.grade}-{student.classNum})
          </div>
        </div>
      </div>

      {/* Warning */}
      {warning && (
        <div className="container" style={{ paddingTop: 12 }}>
          <div className="alert alert-warning anim-fadeIn" style={{ justifyContent: "space-between" }}>
            <span>⚠️ {warning}</span>
            {unansweredNums.length > 0 && (
              <button
                onClick={doSubmit}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                그래도 제출
              </button>
            )}
          </div>
        </div>
      )}

      {/* OMR Table - reference: omrcard.png style */}
      <main className="container" style={styles.main}>
        <div style={styles.tableWrap}>
          <table className="omr-table" style={{ tableLayout: "fixed", width: "100%" }}>
            <colgroup>
              <col style={{ width: 56 }} />
              {[1,2,3,4,5].map(n => <col key={n} />)}
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ background: gradient }}>문항</th>
                <th style={{ background: gradient }}>①</th>
                <th style={{ background: gradient }}>②</th>
                <th style={{ background: gradient }}>③</th>
                <th style={{ background: gradient }}>④</th>
                <th style={{ background: gradient }}>⑤</th>
                <th style={{ background: gradient }}>배점</th>
              </tr>
            </thead>
            <tbody>
              {exam.questions.map((q) => {
                const selected = answers[q.questionNum];
                return (
                  <tr key={q.questionNum}>
                    {/* Question number */}
                    <td className="omr-qnum" style={{
                      background: selected !== undefined
                        ? `${color}15`
                        : undefined,
                      fontWeight: selected !== undefined ? 800 : 600,
                      color: selected !== undefined ? color : "#475569",
                    }}>
                      {q.questionNum}
                    </td>
                    {/* Choice buttons or Subjective input */}
                    {q.isSubjective ? (
                      <td colSpan={5} style={{ padding: "7px 12px" }}>
                        <input
                          type="number" min={0} max={999}
                          value={selected !== undefined ? selected : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              // 미입력 처리 (삭제)
                              setAnswers((prev) => {
                                const next = { ...prev };
                                delete next[q.questionNum];
                                return next;
                              });
                            } else {
                              selectAnswer(q.questionNum, Number(val));
                            }
                          }}
                          placeholder="주관식 정답 입력"
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8,
                            border: `2px solid ${selected !== undefined ? color : "#e2e8f0"}`,
                            fontSize: 16, fontWeight: 700, color: "#0f172a", textAlign: "center",
                            background: selected !== undefined ? `${color}11` : "#f8fafc",
                            outline: "none", transition: "all 0.2s"
                          }}
                        />
                      </td>
                    ) : (
                      [1, 2, 3, 4, 5].map((choice) => (
                        <td key={choice} style={{ padding: "7px 4px" }}>
                          <button
                            className={`omr-circle${selected === choice ? " selected" : ""}`}
                            onClick={() => selectAnswer(q.questionNum, choice)}
                            aria-label={`${q.questionNum}번 ${choice}번 선택`}
                            aria-pressed={selected === choice}
                            style={selected === choice
                              ? { background: color, borderColor: color }
                              : undefined
                            }
                          >
                            {choice}
                          </button>
                        </td>
                      ))
                    )}
                    {/* Score */}
                    <td style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                      {q.score}점
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Fixed Submit Footer */}
      <footer style={styles.footer}>
        <div className="container" style={styles.footerInner}>
          <div style={styles.footerLeft}>
            {unansweredNums.length > 0 ? (
              <div style={styles.footerWarning}>
                <span style={styles.footerWarningIcon}>⚠️</span>
                <span>{unansweredNums.length}문항 미마킹</span>
              </div>
            ) : (
              <div style={styles.footerOk}>
                <span>✅</span>
                <span>마킹 완료!</span>
              </div>
            )}
            <div style={styles.footerProgress}>
              {markedCount}/{totalCount} 완료
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 130, background: gradient, boxShadow: `0 4px 14px ${color}55` }}
          >
            {submitting ? (
              <><span className="spinner" />채점 중...</>
            ) : (
              "제출하기 →"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8faff",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    paddingTop: 12,
    paddingBottom: 0,
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { flexShrink: 0 },
  headerCenter: {
    flex: 1,
    textAlign: "center",
  },
  headerSubject: {
    fontSize: 18,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  headerTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 500,
    marginTop: 2,
  },
  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "6px 14px",
    backdropFilter: "blur(8px)",
    flexShrink: 0,
  },
  timerIcon: { fontSize: 14 },
  timerText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    fontVariantNumeric: "tabular-nums",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 20px 12px",
  },
  progressBg: {
    flex: 1,
    height: 6,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFg: {
    height: "100%",
    background: "#fff",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  progressLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 600,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  infoStrip: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  infoInner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 20px",
    flexWrap: "wrap",
  },
  infoBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
    fontSize: 14,
    color: "#0f172a",
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  infoDetail: {
    fontSize: 13,
    color: "#64748b",
  },
  studentChip: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: 999,
  },
  main: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 100,
  },
  tableWrap: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  footer: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    zIndex: 50,
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderTop: "1px solid #e2e8f0",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
  },
  footerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    gap: 16,
  },
  footerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  footerWarning: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    fontWeight: 600,
    color: "#92400e",
  },
  footerWarningIcon: { fontSize: 14 },
  footerOk: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    fontWeight: 600,
    color: "#059669",
  },
  footerProgress: {
    fontSize: 12,
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums",
  },
};
