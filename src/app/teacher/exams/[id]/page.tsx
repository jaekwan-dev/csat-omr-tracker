"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpen, Calculator, Globe, Plus, Minus, FileText, CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";

/* ── Subject configuration ───────────────────────────────────────────── */

interface SubjectConfig {
  label: string;
  icon: React.ElementType;
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
    icon: BookOpen,
    totalQuestions: 25,
    minQuestions: 15,
    startNum: 1,
    scoreOptions: [4, 5, 6, 7],
    fixedTotal: 100,
    canDeleteQuestions: true,
  },
  MATH: {
    label: "수학",
    icon: Calculator,
    totalQuestions: 20,
    minQuestions: 20,
    startNum: 1,
    scoreOptions: [2, 3, 4],
    fixedTotal: null,
    canDeleteQuestions: false,
  },
  ENGLISH: {
    label: "영어",
    icon: Globe,
    totalQuestions: 28,
    minQuestions: 28,
    startNum: 18,
    scoreOptions: [2, 3],
    fixedTotal: 63,
    canDeleteQuestions: false,
  },
};

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };

const SUBJECT_COLOR_HEX: Record<string, string> = {
  KOREAN: "#7c3aed",
  MATH: "#f97316",
  ENGLISH: "#3b82f6",
};

const SUBJECT_BG: Record<string, string> = {
  KOREAN: "bg-purple-50 border-purple-200 text-purple-700",
  MATH: "bg-orange-50 border-orange-200 text-orange-700",
  ENGLISH: "bg-blue-50 border-blue-200 text-blue-700",
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

export default function EditExamPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>("KOREAN");

  const params = useParams();
  const examId = params.id;
  const [initialLoading, setInitialLoading] = useState(true);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    fetch(`/api/teacher/exams/${examId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.exam) {
          setSubject(d.exam.subject);
          setTitle(d.exam.title);
          setQuestions(d.exam.questions);
          setExistingPdfUrl(d.exam.explanationPdfUrl);
        }
        setInitialLoading(false);
      })
      .catch(() => setInitialLoading(false));
  }, [examId]);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>(() => buildQuestions("KOREAN"));
  const [explanationFile, setExplanationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cfg = SUBJECT_CONFIG[subject];

  
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

  function removeQuestion() {
    setQuestions((prev) => {
      if (prev.length <= cfg.minQuestions) return prev;
      const n = [...prev];
      n.pop(); // Remove last
      return n;
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
  const subjectBgClass = SUBJECT_BG[subject];
  const totalMismatch = cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal;
  
  // Progress calculation
  const scoreProgress = cfg.fixedTotal ? Math.min((maxScore / cfg.fixedTotal) * 100, 100) : 0;

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

    
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), explanationPdfUrl: explanationPdfUrl || existingPdfUrl, questions }),
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

  
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-muted-foreground">시험 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Sticky Header with Actions */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/teacher/exams")}
              className="p-2 -ml-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">시험 수정</h1>
              <p className="text-xs font-medium text-muted-foreground hidden sm:block truncate">
                {SUBJECT_LABEL[subject]} · 총 {questions.length}문항
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {totalMismatch && (
              <span className="text-[11px] sm:text-xs font-bold text-red-500 bg-red-50 px-2 sm:px-3 py-1.5 rounded-lg border border-red-100">
                배점을 {cfg.fixedTotal}점으로 맞춰주세요
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting || !title}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all shrink-0",
                submitting || !title 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              )}
              style={{ background: !title ? "#94a3b8" : colorHex }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 hidden sm:block" />}
              <span>{submitting ? "수정 중..." : "수정하기"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT: Config Panel */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/10">
                <h2 className="font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> 기본 정보
                </h2>
              </div>
              <div className="p-5 space-y-6">
                
                
                {/* Subject Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">과목 (수정 불가)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(SUBJECT_CONFIG).map(([s, c]) => {
                      const isActive = subject === s;
                      const Icon = c.icon;
                      return (
                        <div
                          key={s}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                            isActive
                              ? "shadow-sm"
                              : "bg-secondary/40 border-transparent text-muted-foreground opacity-50"
                          )}
                          style={isActive ? { borderColor: SUBJECT_COLOR_HEX[s], background: `${SUBJECT_COLOR_HEX[s]}08`, color: SUBJECT_COLOR_HEX[s] } : undefined}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
{/* Subject Hints */}
                <div className={cn("rounded-xl px-4 py-3 text-xs font-medium space-y-1.5 border", subjectBgClass)}>
                  <div className="flex justify-between items-center">
                    <span>문항 수</span>
                    <strong className="text-sm">{cfg.canDeleteQuestions ? `${cfg.minQuestions}~${cfg.totalQuestions}문항` : `${cfg.totalQuestions}문항`}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>배점 구성</span>
                    <strong className="text-sm">{cfg.scoreOptions.join(", ")}점</strong>
                  </div>
                  {cfg.fixedTotal && (
                    <div className="flex justify-between items-center">
                      <span>만점 기준</span>
                      <strong className="text-sm">{cfg.fixedTotal}점</strong>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <label htmlFor="examTitle" className="text-sm font-bold text-foreground">시험 제목</label>
                  <input
                    id="examTitle"
                    type="text"
                    placeholder="예: 2024년 6월 기출"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                  />
                </div>

                {/* PDF */}
                <div className="space-y-3">
                  
                  <label htmlFor="explanationFile" className="text-sm font-bold text-foreground">해설지 PDF (선택, 새 파일 업로드 시 교체됨)</label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="explanationFile" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-input rounded-xl cursor-pointer bg-background hover:bg-secondary/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="w-6 h-6 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium text-center">
                          {explanationFile ? (
                            <span className="text-primary font-bold">{explanationFile.name}</span>
                          ) : existingPdfUrl ? (
                            <span className="text-teal-600 font-bold">등록된 해설지가 있습니다.<br/>클릭하여 변경</span>
                          ) : (
                            "클릭하여 PDF 파일 업로드"
                          )}
                        </p>
                      </div>
                      <input
                        id="explanationFile"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => setExplanationFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                </div>

              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-bold text-red-600 flex gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

          </div>

          {/* RIGHT: Questions Panel */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Live Score Tracker */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:sticky md:top-24 md:z-40">
              <div className="flex justify-between items-end mb-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground">배점 합계</h3>
                  {cfg.fixedTotal ? (
                    <p className="text-xs text-muted-foreground">목표 점수: {cfg.fixedTotal}점</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">자유 배점 모드</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-3xl font-black tracking-tighter",
                    totalMismatch ? "text-red-500" : "text-foreground"
                  )} style={!totalMismatch && cfg.fixedTotal ? { color: colorHex } : undefined}>
                    {maxScore}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">점</span>
                </div>
              </div>
              
              {cfg.fixedTotal && (
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-3">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      maxScore > cfg.fixedTotal ? "bg-red-500" : (maxScore === cfg.fixedTotal ? "" : "bg-primary")
                    )}
                    style={{ 
                      width: `${scoreProgress}%`,
                      background: maxScore === cfg.fixedTotal ? colorHex : undefined 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Questions Form */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold flex items-center gap-2">정답 및 배점</h2>
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    총 {questions.length}문항
                  </span>
                </div>
                
                {/* Batch Score Setter */}
                <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-lg shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground px-2">일괄:</span>
                  {cfg.scoreOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => fillAllScores(s)}
                      className="px-2 py-1 rounded-md text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                    >
                      {s}점
                    </button>
                  ))}
                </div>
              </div>

              {/* Add/Remove Controls (Korean) */}
              {cfg.canDeleteQuestions && (
                <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700">문항 수를 조절할 수 있습니다</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={removeQuestion}
                      disabled={questions.length <= cfg.minQuestions}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Minus className="w-3 h-3" /> 삭제
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={questions.length >= cfg.totalQuestions}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-3 h-3" /> 추가
                    </button>
                  </div>
                </div>
              )}

              {/* The Grid */}
              <div className="divide-y divide-border">
                {questions.map((q, i) => (
                  <div 
                    key={q.questionNum} 
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 hover:bg-muted/20 transition-colors group"
                  >
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      {/* Q Number */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm shrink-0"
                        style={{ background: `${colorHex}15`, color: colorHex }}
                      >
                        {q.questionNum}
                      </div>

                      {/* Score Area (Mobile Only) */}
                      <div className="sm:hidden flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">배점</span>
                        <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                          {cfg.scoreOptions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setScore(i, s)}
                              className={cn(
                                "w-7 h-7 rounded-md text-xs font-bold transition-all",
                                q.score === s
                                  ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              style={q.score === s ? { color: colorHex } : undefined}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Answer Area */}
                    <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                      <div className="hidden sm:flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-muted-foreground">정답</span>
                      </div>
                      <div className="flex gap-2 justify-between sm:justify-start">
                        {[1, 2, 3, 4, 5].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setAnswer(i, c)}
                            className={cn(
                              "flex-1 max-w-[48px] sm:flex-none sm:w-9 sm:h-9 md:w-10 md:h-10 aspect-square rounded-full text-sm font-bold transition-all shadow-sm flex items-center justify-center",
                              q.correctAnswer === c
                                ? "text-white scale-105"
                                : "bg-background border border-input text-muted-foreground hover:border-foreground/30 hover:bg-secondary/50"
                            )}
                            style={q.correctAnswer === c ? { background: colorHex, borderColor: colorHex } : undefined}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Score Area (Desktop Only) */}
                    <div className="hidden sm:flex shrink-0 flex-col gap-2 items-end">
                      <span className="text-xs font-bold text-muted-foreground">배점</span>
                      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                        {cfg.scoreOptions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setScore(i, s)}
                            className={cn(
                              "w-8 h-8 rounded-md text-xs font-bold transition-all",
                              q.score === s
                                ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            style={q.score === s ? { color: colorHex } : undefined}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
