"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, AlertTriangle, CheckCircle2, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";
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

const SUBJECT_META: Record<string, { label: string; color: string; bgLight: string; text: string; gradient: string }> = {
  KOREAN: {
    label: "국어",
    color: "bg-purple-400",
    bgLight: "bg-purple-50",
    text: "text-purple-500",
    gradient: "from-purple-400 to-purple-500",
  },
  MATH: {
    label: "수학",
    color: "bg-orange-400",
    bgLight: "bg-orange-50",
    text: "text-orange-500",
    gradient: "from-orange-400 to-orange-500",
  },
  ENGLISH: {
    label: "영어",
    color: "bg-blue-400",
    bgLight: "bg-blue-50",
    text: "text-blue-500",
    gradient: "from-blue-400 to-blue-500",
  },
};

export default function OmrSheet({ exam, student }: OmrSheetProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  
  const storageKey = `omr_answers_${exam.id}_${student.studentId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    } catch (e) {
      console.error("임시저장 데이터를 불러오는데 실패했습니다.", e);
    }
  }, [storageKey]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [answers, storageKey]);

  const meta = SUBJECT_META[exam.subject] ?? SUBJECT_META.ENGLISH;
  
  const markedCount = Object.keys(answers).length;
  const totalCount = exam.questions.length;
  const progress = totalCount > 0 ? (markedCount / totalCount) * 100 : 0;
  const unansweredNums = exam.questions
    .filter((q) => answers[q.questionNum] === undefined)
    .map((q) => q.questionNum);

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
    const isDirectSubmitSubject = exam.subject === "KOREAN" || exam.subject === "MATH";

    if (isDirectSubmitSubject) {
      const confirmMessage = unansweredNums.length > 0
        ? `미마킹 문항 ${unansweredNums.length}개가 있습니다.\n정말 제출하겠습니까?`
        : "정말 제출하겠습니까?";
      if (window.confirm(confirmMessage)) {
        await doSubmit();
      }
      return;
    }

    if (unansweredNums.length > 0) {
      setWarning(`미마킹 문항 ${unansweredNums.length}개: ${unansweredNums.join(", ")}번`);
      return;
    }

    if (window.confirm("정말 제출하겠습니까?")) {
      await doSubmit();
    }
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
      localStorage.removeItem(storageKey);
      router.push(`/result/${data.submissionId}`);
    } catch {
      setWarning("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-28">
      
      {/* ─── Sticky Header ─── */}
      <header className={cn("sticky top-0 z-50 bg-gradient-to-r text-white shadow-md", meta.gradient)}>
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center mx-2">
            <h1 className="text-lg font-black tracking-tight">{meta.label}</h1>
            <p className="text-[11px] font-bold text-white/80 tracking-wider">OMR 마킹</p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1.5 backdrop-blur-sm shadow-inner">
            <Clock className="w-3.5 h-3.5 opacity-80" />
            <span className="text-sm font-bold tracking-wider">{formatTime(elapsedSec)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-1.5">
          <div 
            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ─── Info Strip ─── */}
      <div className="bg-background border-b border-border shadow-sm">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className={cn("w-2 h-2 rounded-full shadow-sm", meta.color)} />
              {exam.title}
            </div>
            <div className="text-xs font-medium text-muted-foreground ml-4">
              {exam.startNum}번 ~ {exam.startNum + exam.totalQuestions - 1}번 · 총 {totalCount}문항
            </div>
          </div>
          <div className="bg-secondary px-3 py-1.5 rounded-full text-xs font-bold text-secondary-foreground shadow-sm">
            {student.name} ({student.grade}-{student.classNum})
          </div>
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 pt-6 flex-1">
        
        {/* Warning Alert */}
        {warning && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold leading-tight">{warning}</p>
            </div>
            {unansweredNums.length > 0 && (
              <button
                onClick={doSubmit}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm ml-4"
              >
                그래도 제출
              </button>
            )}
          </div>
        )}

        {/* ─── OMR Grid ─── */}
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {exam.questions.map((q) => {
              const selected = answers[q.questionNum];
              const isAnswered = selected !== undefined;

              return (
                <div 
                  key={q.questionNum} 
                  className={cn(
                    "flex items-center p-3 sm:p-4 transition-colors",
                    isAnswered ? meta.bgLight : "hover:bg-muted/30"
                  )}
                >
                  
                  {/* Q Number */}
                  <div className="w-10 sm:w-14 flex flex-col items-center justify-center shrink-0">
                    <span className={cn(
                      "text-base sm:text-lg font-black transition-colors",
                      isAnswered ? meta.text : "text-muted-foreground"
                    )}>
                      {q.questionNum}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-0.5">
                      {q.score}점
                    </span>
                  </div>

                  {/* Options */}
                  <div className="flex-1 flex justify-center ml-2 sm:ml-6">
                    {q.isSubjective ? (
                      <input
                        type="number" min={0} max={999}
                        value={isAnswered ? selected : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setAnswers((prev) => {
                              const next = { ...prev };
                              delete next[q.questionNum];
                              return next;
                            });
                          } else {
                            selectAnswer(q.questionNum, Number(val));
                          }
                        }}
                        placeholder="정답"
                        className={cn(
                          "w-full max-w-[140px] text-center text-lg font-black rounded-xl border-2 py-3 focus:outline-none transition-all shadow-sm",
                          isAnswered
                            ? `border-${meta.color.replace('bg-', '')} bg-white text-foreground ring-4 ring-${meta.color.replace('bg-', '')}/20`
                            : "border-input bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/20"
                        )}
                        style={isAnswered ? { borderColor: meta.color.replace('bg-', ''), color: meta.color.replace('bg-', '') } : undefined} // fallback if tailwind safelist misses
                      />
                    ) : (
                      <div className="flex gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5].map((choice) => (
                          <button
                            key={choice}
                            onClick={() => selectAnswer(q.questionNum, choice)}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-black transition-all duration-200 border-2",
                              selected === choice
                                ? cn(meta.color, "border-transparent text-white shadow-md scale-110")
                                : "bg-background border-input text-muted-foreground hover:border-foreground/30 hover:bg-secondary"
                            )}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* ─── Fixed Bottom Footer ─── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          <div className="flex flex-col gap-1">
            {unansweredNums.length > 0 ? (
              <div className="flex items-center gap-1.5 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold">{unansweredNums.length}문항 미마킹</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-bold">마킹 완료!</span>
              </div>
            )}
            <div className="text-xs font-bold text-muted-foreground">
              {markedCount} / {totalCount} 문항
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-black text-white shadow-lg transition-all",
              submitting
                ? "opacity-70 cursor-wait"
                : "hover:-translate-y-1 hover:shadow-xl active:translate-y-0",
              meta.gradient
            )}
            style={{ background: `var(--tw-gradient-stops)` }} // Let Tailwind handle the gradient via class
          >
            {submitting ? (
              <span className="spinner !w-5 !h-5 !border-white/30 !border-t-white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </footer>
    </div>
  );
}
