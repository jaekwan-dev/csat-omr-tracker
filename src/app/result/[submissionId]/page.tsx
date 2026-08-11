import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, FileText, CheckCircle2, XCircle, Home, Download, BarChart3, Target, Award, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

const SUBJECT_META: Record<string, { label: string; colorVar: string }> = {
  KOREAN: {
    label: "국어",
    colorVar: "var(--color-subject-korean)",
  },
  MATH: {
    label: "수학",
    colorVar: "var(--color-subject-math)",
  },
  ENGLISH: {
    label: "영어",
    colorVar: "var(--color-subject-english)",
  },
};

export default async function ResultPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { submissionId } = await params;
  const subId = Number(submissionId);
  if (isNaN(subId)) redirect("/");

  const submission = await prisma.submission.findUnique({
    where: { id: subId },
    include: { exam: { include: { questions: { orderBy: { questionNum: "asc" } } } } },
  });

  if (!submission || submission.studentId !== session.studentId) redirect("/");

  const allSubmissions = await prisma.submission.findMany({
    where: { examId: submission.examId },
    select: { answers: true, totalScore: true },
  });

  const totalExamSubmissions = allSubmissions.length;
  const rank = allSubmissions.filter((s) => s.totalScore > submission.totalScore).length + 1;

  const answers = submission.answers as Record<string, number>;
  const results = submission.exam.questions.map((q) => {
    const myAnswer = answers[String(q.questionNum)] ?? 0;
    const isCorrect = myAnswer === q.correctAnswer;

    let qCorrectCount = 0;
    if (totalExamSubmissions > 0) {
      for (const sub of allSubmissions) {
        const subAnswers = sub.answers as Record<string, number>;
        if (subAnswers[String(q.questionNum)] === q.correctAnswer) {
          qCorrectCount++;
        }
      }
    }
    const accuracy = totalExamSubmissions > 0 ? Math.round((qCorrectCount / totalExamSubmissions) * 100) : 0;

    return {
      questionNum: q.questionNum,
      correctAnswer: q.correctAnswer,
      myAnswer,
      isCorrect,
      score: q.score,
      earnedScore: isCorrect ? q.score : 0,
      accuracy
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = results.filter((r) => !r.isCorrect && r.myAnswer !== 0).length;
  const unansweredCount = results.filter((r) => r.myAnswer === 0).length;
  const maxScore = results.reduce((s, r) => s + r.score, 0);
  const scorePercent = maxScore > 0 ? Math.round((submission.totalScore / maxScore) * 100) : 0;

  const meta = SUBJECT_META[submission.exam.subject] ?? SUBJECT_META.ENGLISH;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-12">

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-900 shadow-sm">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
          </Link>
          <span className="text-lg font-bold tracking-widest text-slate-400">결과</span>
          <div className="w-10" />
        </div>
      </header>

      {/* ─── Premium Hero Section ─── */}
      <div className="container max-w-4xl mx-auto px-6 pt-12 pb-10 relative">
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 shadow-sm"
            style={{
              backgroundColor: `color-mix(in oklch, ${meta.colorVar} 10%, transparent)`,
              borderColor: `color-mix(in oklch, ${meta.colorVar} 20%, transparent)`
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: meta.colorVar }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: meta.colorVar }}>{meta.label}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.1] mb-4 max-w-2xl">
            {submission.exam.title}
          </h1>

          <p className="text-sm font-semibold text-muted-foreground tracking-wide mb-12">
            {session.name} ({session.grade}학년 {session.classNum}반) <span className="mx-2 text-border">|</span> {new Date(submission.submittedAt).toLocaleDateString()} 제출
          </p>

          <div className="relative">
            <div
              className="absolute inset-0 blur-3xl -z-10 rounded-full scale-150 opacity-40"
              style={{ background: `radial-gradient(circle, color-mix(in oklch, ${meta.colorVar} 40%, transparent) 0%, transparent 70%)` }}
            />
            <div className="flex items-baseline gap-2">
              <span
                className="text-6xl sm:text-7xl font-black leading-none tracking-tighter tabular-nums drop-shadow-sm"
                style={{ color: meta.colorVar }}
              >
                {submission.totalScore}
              </span>
              <span className="text-xl sm:text-2xl font-bold tracking-tighter" style={{ color: `color-mix(in oklch, ${meta.colorVar} 50%, transparent)` }}>
                / {maxScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-4xl mx-auto px-6 flex-1 flex flex-col gap-16">

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both ease-out">
          {[
            { label: "정답", value: correctCount, icon: CheckCircle2, isCore: true },
            { label: "오답", value: wrongCount, icon: XCircle, isCore: false },
            { label: "시험 등수", value: `${rank}등`, icon: Award, isCore: false },
            { label: "정답률", value: `${scorePercent}%`, icon: Target, isCore: false },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-card rounded-[2rem] p-6 shadow-sm border flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300"
                style={{
                  borderColor: `color-mix(in oklch, ${meta.colorVar} ${s.isCore ? '20%' : '5%'}, transparent)`
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${meta.colorVar} ${s.isCore ? '15%' : '5%'}, transparent)`,
                    color: s.isCore ? meta.colorVar : "var(--muted-foreground)"
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className="text-3xl font-black mb-1 tabular-nums tracking-tight"
                  style={{ color: s.isCore ? meta.colorVar : "var(--foreground)" }}
                >
                  {s.value}
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* ─── Action Banner ─── */}
        {submission.exam.explanationPdfUrl && (
          <div
            className="w-full rounded-[2rem] p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-700 delay-300 fill-mode-both border"
            style={{
              backgroundColor: `color-mix(in oklch, ${meta.colorVar} 10%, var(--card))`,
              borderColor: `color-mix(in oklch, ${meta.colorVar} 20%, transparent)`
            }}
          >
            <div className="flex items-center gap-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner border"
                style={{
                  backgroundColor: `color-mix(in oklch, ${meta.colorVar} 15%, transparent)`,
                  borderColor: `color-mix(in oklch, ${meta.colorVar} 30%, transparent)`,
                  color: meta.colorVar
                }}
              >
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight" style={{ color: meta.colorVar }}>상세 해설지 제공</h3>
                <p className="text-sm font-medium opacity-80 mt-1" style={{ color: meta.colorVar }}>오답 노트를 작성하고 부족한 부분을 보완하세요.</p>
              </div>
            </div>
            <a
              href={submission.exam.explanationPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 text-white text-sm font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 hover:scale-105 active:scale-100"
              style={{ backgroundColor: meta.colorVar }}
            >
              <Download className="w-4 h-4" />
              다운로드
            </a>
          </div>
        )}

        {/* ─── Detailed Results List (Replaces Table) ─── */}
        <div className="bg-card rounded-[2.5rem] p-4 sm:p-10 shadow-sm border animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both overflow-hidden">
          <div className="flex items-center gap-3 mb-6 sm:mb-10 pl-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">문항별 상세 분석</h2>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            {/* List Header */}
            <div className="flex items-center px-1 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest border-b mb-2">
              <div className="w-8 sm:w-16 text-center">No.</div>
              <div className="flex-1 flex justify-center gap-4 sm:gap-20">
                <div className="w-12 sm:w-16 text-center">내 답안</div>
                <div className="w-12 sm:w-16 text-center">정답</div>
              </div>
              <div className="w-12 sm:w-16 text-right">배점</div>
              <div className="w-14 sm:w-16 text-right">정답률</div>
            </div>

            {/* List Body */}
            {results.map((r, idx) => (
              <div
                key={r.questionNum}
                className={cn(
                  "flex items-center px-1 sm:px-4 py-3 sm:py-4 rounded-2xl transition-colors",
                  r.isCorrect ? "hover:bg-emerald-500/10" : r.myAnswer === 0 ? "hover:bg-muted/50" : "hover:bg-rose-500/10"
                )}
                style={r.isCorrect ? { backgroundColor: `color-mix(in oklch, ${meta.colorVar} 5%, transparent)` } : {}}
              >
                {/* Number */}
                <div className="w-8 sm:w-16 flex flex-col items-center">
                  <span className="text-sm sm:text-base font-black text-foreground">{r.questionNum}</span>
                </div>

                {/* Answers Compare */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-20">
                  <div className="w-12 sm:w-16 flex items-center justify-center">
                    {r.myAnswer === 0 ? (
                      <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground bg-muted px-1.5 py-1 rounded-md">미응답</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-xs sm:text-sm font-black shadow-sm"
                        )}
                        style={{
                          backgroundColor: r.isCorrect ? `color-mix(in oklch, ${meta.colorVar} 15%, transparent)` : "color-mix(in oklch, var(--destructive) 15%, transparent)",
                          color: r.isCorrect ? meta.colorVar : "var(--destructive)"
                        }}
                      >
                        {r.myAnswer}
                      </span>
                    )}
                  </div>

                  {/* Result Icon Arrow */}
                  <div className="hidden sm:flex items-center justify-center text-muted-foreground/30">
                    {r.isCorrect ? (
                      <ArrowRight className="w-4 h-4" style={{ color: meta.colorVar }} />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive/50" />
                    )}
                  </div>

                  <div className="w-12 sm:w-16 flex items-center justify-center">
                    <span
                      className="inline-flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-xs sm:text-sm font-black ring-1 shadow-sm"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${meta.colorVar} 5%, transparent)`,
                        color: meta.colorVar,
                        "--tw-ring-color": `color-mix(in oklch, ${meta.colorVar} 20%, transparent)`
                      } as React.CSSProperties}
                    >
                      {r.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="w-12 sm:w-16 flex flex-col items-end justify-center">
                  <span
                    className="text-xs sm:text-sm font-black"
                    style={{ color: r.isCorrect ? meta.colorVar : "var(--muted-foreground)" }}
                  >
                    {r.isCorrect ? `+${r.score}` : '0'}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-bold text-muted-foreground mt-0.5">{r.score}점</span>
                </div>

                {/* Accuracy */}
                <div className="w-14 sm:w-16 flex flex-col items-end justify-center">
                  <span className="text-xs sm:text-sm font-black text-foreground/70">{r.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Total */}
          <div className="mt-8 pt-8 border-t flex items-center justify-between px-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Final Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums" style={{ color: meta.colorVar }}>{submission.totalScore}</span>
              <span className="text-sm font-bold text-muted-foreground">점</span>
            </div>
          </div>
        </div>

        {/* ─── Bottom Actions ─── */}
        <div className="flex justify-center pt-8 pb-10">
          <Link
            href="/"
            className="group flex items-center gap-3 px-10 py-5 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all"
            style={{ backgroundColor: meta.colorVar }}
          >
            <Home className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

      </main>
    </div>
  );
}
