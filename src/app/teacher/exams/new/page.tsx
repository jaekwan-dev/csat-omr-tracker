"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

const SUBJECT_COLOR: Record<string, string> = {
  KOREAN: "bg-purple-600",
  MATH: "bg-orange-500",
  ENGLISH: "bg-blue-500",
};
const SUBJECT_COLOR_HEX: Record<string, string> = {
  KOREAN: "#7c3aed",
  MATH: "#f97316",
  ENGLISH: "#3b82f6",
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

  const maxScore = useMemo(() => questions.reduce((s, q) => s + q.score, 0), [questions]);
  const colorHex = SUBJECT_COLOR_HEX[subject];
  const totalMismatch = cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal;

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

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => router.push("/teacher/exams")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← 돌아가기
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-1">새 시험 등록</h1>
      <p className="text-sm text-muted-foreground mb-8">시험 정보와 각 문항의 정답 및 배점을 입력하세요.</p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─── Basic Info Card ─── */}
        <div className="bg-card rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold">기본 정보</h2>

          {/* Subject Selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">과목 선택</label>
            <div className="flex gap-2">
              {Object.entries(SUBJECT_CONFIG).map(([s, c]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    subject === s
                      ? "text-white shadow-md scale-[1.02]"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  )}
                  style={subject === s ? { background: SUBJECT_COLOR_HEX[s] } : undefined}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject info */}
          <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground space-y-0.5">
            <div className="font-medium text-foreground">📋 {cfg.label} 설정</div>
            <div>• 문항 수: {cfg.canDeleteQuestions ? `${cfg.minQuestions}~${cfg.totalQuestions}문항 (삭제 가능)` : `${cfg.totalQuestions}문항 (고정)`}</div>
            <div>• 배점: {cfg.scoreOptions.join(", ")}점</div>
            {cfg.fixedTotal && <div>• 만점: {cfg.fixedTotal}점</div>}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="examTitle" className="text-xs font-medium text-muted-foreground mb-2 block">시험 제목</label>
            <input
              id="examTitle"
              type="text"
              placeholder="예: 2024년 6월 기출"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-foreground/20 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">회차, 날짜, 기출명 등을 자유롭게 입력하세요.</p>
          </div>

          {/* PDF upload */}
          <div>
            <label htmlFor="explanationFile" className="text-xs font-medium text-muted-foreground mb-2 block">해설지 PDF 업로드 (선택)</label>
            <input
              id="explanationFile"
              type="file"
              accept="application/pdf"
              onChange={(e) => setExplanationFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1.5">학생들이 시험 제출 후 다운로드할 수 있는 해설지(PDF)를 업로드합니다.</p>
          </div>
        </div>

        {/* ─── Questions Card ─── */}
        <div className="bg-card rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">문항별 정답 및 배점</h2>
            <div className="flex gap-1.5 items-center flex-wrap">
              <span className="text-xs text-muted-foreground">전체 배점:</span>
              {cfg.scoreOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => fillAllScores(s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  전체 {s}점
                </button>
              ))}
            </div>
          </div>

          {/* Score summary bar */}
          <div className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3",
            totalMismatch
              ? "bg-red-50 border border-red-200"
              : "bg-muted/50"
          )}>
            <span className={cn(
              "text-sm font-bold",
              totalMismatch ? "text-red-600" : "text-foreground"
            )}>
              합계 {maxScore}점
            </span>
            {cfg.fixedTotal && (
              <span className={cn(
                "text-xs font-medium",
                totalMismatch ? "text-red-500" : "text-muted-foreground"
              )}>
                {totalMismatch
                  ? `${maxScore > cfg.fixedTotal ? `${maxScore - cfg.fixedTotal}점 초과` : `${cfg.fixedTotal - maxScore}점 부족`} (목표 ${cfg.fixedTotal}점)`
                  : `✓ ${cfg.fixedTotal}점 만점`
                }
              </span>
            )}
          </div>

          {/* 국어: question count control */}
          {cfg.canDeleteQuestions && (
            <div className="flex items-center gap-3 flex-wrap rounded-xl bg-muted/30 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                현재 {questions.length}문항
              </span>
              <span className="text-xs text-muted-foreground">
                (최소 {cfg.minQuestions} ~ 최대 {cfg.totalQuestions})
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= cfg.totalQuestions}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  + 추가
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(questions.length - 1)}
                  disabled={questions.length <= cfg.minQuestions}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  − 삭제
                </button>
              </div>
            </div>
          )}

          {/* Question rows */}
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div
                key={q.questionNum}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-colors",
                  i % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
              >
                {/* Number badge */}
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: colorHex }}
                >
                  {q.questionNum}
                </span>

                {/* Answer buttons */}
                <div className="flex-1 flex justify-center">
                  {q.isSubjective ? (
                    <input
                      type="number" min={0} max={999}
                      value={q.correctAnswer}
                      onChange={(e) => setAnswer(i, Number(e.target.value))}
                      className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring/30"
                      placeholder="정답"
                    />
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAnswer(i, c)}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-bold transition-all",
                            q.correctAnswer === c
                              ? "text-white shadow-md scale-110"
                              : "bg-background border border-input text-muted-foreground hover:border-foreground/30"
                          )}
                          style={q.correctAnswer === c ? { background: colorHex } : undefined}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score pills */}
                <div className="flex gap-1 shrink-0">
                  {cfg.scoreOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScore(i, s)}
                      className={cn(
                        "min-w-[30px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all",
                        q.score === s
                          ? "text-white shadow-sm"
                          : "bg-background border border-input text-muted-foreground hover:border-foreground/30"
                      )}
                      style={q.score === s ? { background: colorHex } : undefined}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Delete (국어 only) */}
                {cfg.canDeleteQuestions && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= cfg.minQuestions}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Warning */}
          {totalMismatch && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
              ⚠️ 배점 합계가 {cfg.fixedTotal}점이 되어야 합니다. (현재 {maxScore}점, {maxScore > cfg.fixedTotal! ? `${maxScore - cfg.fixedTotal!}점 초과` : `${cfg.fixedTotal! - maxScore}점 부족`})
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title || totalMismatch}
          className={cn(
            "w-full py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          )}
          style={{ background: totalMismatch ? "#94a3b8" : colorHex }}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2"><span className="spinner" />등록 중...</span>
          ) : "📝 시험 등록하기"}
        </button>
      </form>
    </div>
  );
}
