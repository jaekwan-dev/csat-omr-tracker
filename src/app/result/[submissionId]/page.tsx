import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  Home,
  HelpCircle,
  XCircle,
  BookOpen,
  Calculator,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

const SUBJECT_META: Record<string, { label: string; icon: any }> = {
  KOREAN: { label: "국어", icon: BookOpen },
  MATH: { label: "수학", icon: Calculator },
  ENGLISH: { label: "영어", icon: Globe },
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

  const exam = submission.exam;
  const meta = SUBJECT_META[exam.subject] ?? SUBJECT_META.ENGLISH;
  const SubjectIcon = meta.icon;

  const submittedAt = new Date(submission.submittedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-sidebar px-4 text-sidebar-foreground">
        <Button render={<Link href="/" />} nativeButton={false} variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <ChevronLeft />
          <span className="sr-only">뒤로가기</span>
        </Button>
        <span className="text-sm font-semibold tracking-wide">시험 결과</span>
        <Button render={<Link href="/" />} nativeButton={false} variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Home />
          <span className="sr-only">홈으로</span>
        </Button>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:gap-8">
        {/* Hero */}
        <section className="flex flex-col items-center gap-4 text-center">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 border px-3 py-1 text-xs font-semibold",
              exam.subject === "KOREAN" && "border-subject-korean/20 bg-subject-korean/10 text-subject-korean",
              exam.subject === "MATH" && "border-subject-math/20 bg-subject-math/10 text-subject-math",
              exam.subject === "ENGLISH" && "border-subject-english/20 bg-subject-english/10 text-subject-english",
            )}
          >
            <SubjectIcon className="size-3.5" />
            {meta.label}
          </Badge>

          <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {exam.title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {session.name} · {session.grade}학년 {session.classNum}반
            <span className="mx-2 text-border">|</span>
            {submittedAt} 제출
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-6xl font-bold tabular-nums leading-none tracking-tight text-primary">
              {submission.totalScore}
            </span>
            <span className="text-lg font-medium text-muted-foreground">/ {maxScore}점</span>
          </div>
        </section>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                정답
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-emerald-500">{correctCount}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <XCircle className="size-3.5 text-destructive" />
                오답
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-destructive">{wrongCount}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <HelpCircle className="size-3.5" />
                미응답
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{unansweredCount}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Award className="size-3.5" />
                등수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {rank}
                <span className="text-sm font-normal text-muted-foreground"> / {totalExamSubmissions}명</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Explanation banner */}
        {exam.explanationPdfUrl && (
          <Card className="border-primary/15 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">상세 해설지 제공</p>
                  <p className="text-xs text-muted-foreground">오답 노트를 작성하고 부족한 부분을 보완하세요.</p>
                </div>
              </div>
              <Button
                render={<a href={exam.explanationPdfUrl} target="_blank" rel="noreferrer" />}
                nativeButton={false}
                className="w-full shrink-0 sm:w-auto"
              >
                <Download data-icon="inline-start" />
                다운로드
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Detail table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-muted-foreground" />
              문항별 상세 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">번호</TableHead>
                  <TableHead className="text-center">내 답안</TableHead>
                  <TableHead className="text-center">정답</TableHead>
                  <TableHead className="text-right">배점</TableHead>
                  <TableHead className="text-right">정답률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow
                    key={r.questionNum}
                    className={cn(
                      r.isCorrect && "bg-emerald-500/5",
                      !r.isCorrect && r.myAnswer !== 0 && "bg-destructive/5",
                    )}
                  >
                    <TableCell className="text-center font-medium">{r.questionNum}</TableCell>
                    <TableCell className="text-center">
                      {r.myAnswer === 0 ? (
                        <Badge variant="secondary" className="font-normal">
                          미응답
                        </Badge>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-md text-sm font-semibold",
                            r.isCorrect ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive",
                          )}
                        >
                          {r.myAnswer}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
                        {r.correctAnswer}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground font-medium">
                      {r.score}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.accuracy}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bottom action */}
        <div className="flex justify-center pb-4 pt-2">
          <Button render={<Link href="/" />} nativeButton={false} size="lg" className="gap-2 px-3">
            <Home data-icon="inline-start" />
            홈으로 돌아가기
          </Button>
        </div>
      </main>
    </div>
  );
}
