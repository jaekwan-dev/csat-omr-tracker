import { prisma } from "@/lib/prisma";
import { ExamListClient } from "./ExamListClient";
import type { Exam } from "@/lib/exam-data";

export default async function ExamsPage() {
  const rawExams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "desc" }],
    include: {
      submissions: { select: { totalScore: true } },
    },
  });

  const exams: Exam[] = rawExams.map((exam) => {
    const scores = exam.submissions.map((s) => s.totalScore);
    const submissionCount = scores.length;
    let avg = 0, max = 0, min = 0;

    if (submissionCount > 0) {
      max = Math.max(...scores);
      min = Math.min(...scores);
      avg = Math.round((scores.reduce((a, b) => a + b, 0) / submissionCount) * 10) / 10;
    }

    return {
      id: exam.id,
      subject: exam.subject as "KOREAN" | "MATH" | "ENGLISH",
      title: exam.title,
      totalQuestions: exam.totalQuestions,
      isPublished: exam.isPublished,
      stats: { avg, max, min, submissionCount },
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">시험 관리</h1>
        <p className="text-sm text-muted-foreground">등록된 시험을 관리하고 응시 통계를 확인하세요.</p>
      </div>

      <ExamListClient initialExams={exams} />
    </div>
  );
}
