import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function TeacherDashboardPage() {
  const exams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "asc" }],
    select: { id: true, subject: true, title: true, totalQuestions: true },
  });
  return <DashboardClient exams={exams} />;
}
