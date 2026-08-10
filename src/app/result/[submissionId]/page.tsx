import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, FileText, CheckCircle2, XCircle, Home, Download, BarChart3, Target, Award, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ submissionId: string }>;
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col pb-12 selection:bg-black selection:text-white">
      
      {/* ─── Minimalist Header ─── */}
      <header className="sticky top-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-black/5">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-black/70 group-hover:text-black transition-colors" />
          </Link>
          <span className="text-sm font-bold tracking-widest text-black/80">RESULT</span>
          <div className="w-10" />
        </div>
      </header>

      {/* ─── Premium Hero Section ─── */}
      <div className="container max-w-4xl mx-auto px-6 pt-16 pb-12 relative">
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 mb-8 shadow-sm">
            <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", meta.color)} />
            <span className="text-xs font-bold tracking-widest uppercase text-black/70">{meta.label}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-[1.1] mb-4 max-w-2xl">
            {submission.exam.title}
          </h1>
          
          <p className="text-sm font-semibold text-black/50 tracking-wide mb-12">
            {session.name} ({session.grade}학년 {session.classNum}반) <span className="mx-2 text-black/20">|</span> {new Date(submission.submittedAt).toLocaleDateString()} 제출
          </p>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent blur-3xl -z-10 rounded-full scale-150 opacity-50" />
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-black leading-none tracking-tighter tabular-nums drop-shadow-sm">
                {submission.totalScore}
              </span>
              <span className="text-lg sm:text-xl font-bold text-black/30 tracking-tighter">
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
            { label: "정답", value: correctCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "오답", value: wrongCount, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
            { label: "시험 등수", value: `${rank}등`, icon: Award, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "정답률", value: `${scorePercent}%`, icon: Target, color: "text-black", bg: "bg-black/5" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03] flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", s.bg, s.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={cn("text-3xl font-black mb-1 tabular-nums tracking-tight", s.color)}>{s.value}</div>
                <div className="text-xs font-bold text-black/40 uppercase tracking-widest">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* ─── Action Banner ─── */}
        {submission.exam.explanationPdfUrl && (
          <div className="w-full bg-black rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_40px_rgb(0,0,0,0.15)] flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-700 delay-300 fill-mode-both">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">상세 해설지 제공</h3>
                <p className="text-sm font-medium text-white/60 mt-1">오답 노트를 작성하고 부족한 부분을 보완하세요.</p>
              </div>
            </div>
            <a 
              href={submission.exam.explanationPdfUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-white/90 text-black text-sm font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 hover:scale-105 active:scale-100"
            >
              <Download className="w-4 h-4" />
              다운로드
            </a>
          </div>
        )}

        {/* ─── Detailed Results List (Replaces Table) ─── */}
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-black/[0.03] animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both overflow-hidden">
          <div className="flex items-center gap-3 mb-6 sm:mb-10 pl-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-black/40" />
            <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">문항별 상세 분석</h2>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            {/* List Header */}
            <div className="flex items-center px-1 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-black/40 uppercase tracking-widest border-b border-black/5 mb-2">
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
                  r.isCorrect ? "hover:bg-emerald-50/50" : r.myAnswer === 0 ? "hover:bg-black/5" : "hover:bg-rose-50/50"
                )}
              >
                {/* Number */}
                <div className="w-8 sm:w-16 flex flex-col items-center">
                  <span className="text-sm sm:text-base font-black text-black">{r.questionNum}</span>
                </div>

                {/* Answers Compare */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-20">
                  <div className="w-12 sm:w-16 flex items-center justify-center">
                    {r.myAnswer === 0 ? (
                      <span className="text-[10px] sm:text-[11px] font-bold text-black/30 bg-black/5 px-1.5 py-1 rounded-md">미응답</span>
                    ) : (
                      <span className={cn(
                        "inline-flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-xs sm:text-sm font-black shadow-sm",
                        r.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {r.myAnswer}
                      </span>
                    )}
                  </div>
                  
                  {/* Result Icon Arrow */}
                  <div className="hidden sm:flex items-center justify-center text-black/20">
                    {r.isCorrect ? (
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-300" />
                    )}
                  </div>

                  <div className="w-12 sm:w-16 flex items-center justify-center">
                    <span className="inline-flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-xs sm:text-sm font-black bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm">
                      {r.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="w-12 sm:w-16 flex flex-col items-end justify-center">
                  <span className={cn(
                    "text-xs sm:text-sm font-black",
                    r.isCorrect ? "text-emerald-600" : "text-black/30"
                  )}>
                    {r.isCorrect ? `+${r.score}` : '0'}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-bold text-black/30 mt-0.5">{r.score}점</span>
                </div>

                {/* Accuracy */}
                <div className="w-14 sm:w-16 flex flex-col items-end justify-center">
                  <span className="text-xs sm:text-sm font-black text-black/70">{r.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Total */}
          <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between px-4">
            <span className="text-sm font-bold text-black/40 uppercase tracking-widest">Final Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-black tracking-tighter tabular-nums">{submission.totalScore}</span>
              <span className="text-sm font-bold text-black/30">점</span>
            </div>
          </div>
        </div>

        {/* ─── Bottom Actions ─── */}
        <div className="flex justify-center pt-8 pb-10">
          <Link 
            href="/" 
            className="group flex items-center gap-3 px-10 py-5 bg-black text-white rounded-full text-sm font-bold shadow-[0_10px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.25)] hover:-translate-y-1 active:translate-y-0 transition-all"
          >
            <Home className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" /> 
            <span>홈으로 돌아가기</span>
          </Link>
        </div>
        
      </main>
    </div>
  );
}
