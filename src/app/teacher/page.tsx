import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function TeacherDashboardPage() {
  const rawExams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "asc" }],
    include: {
      submissions: { select: { totalScore: true } },
    },
  });

  const exams = rawExams.map(exam => {
    const scores = exam.submissions.map(s => s.totalScore);
    const submissionCount = scores.length;
    let avg = 0, max = 0, min = 0;
    if (submissionCount > 0) {
      max = Math.max(...scores);
      min = Math.min(...scores);
      avg = Math.round((scores.reduce((a, b) => a + b, 0) / submissionCount) * 10) / 10;
    }
    return {
      id: exam.id,
      subject: exam.subject,
      title: exam.title,
      totalQuestions: exam.totalQuestions,
      isPublished: exam.isPublished,
      stats: { avg, max, min, submissionCount },
    };
  });

  return <DashboardClient initialExams={exams} />;
}
