import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StudentHomeClient from "./StudentHomeClient";

export default async function MainPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // 현재 로그인한 학생의 이미 제출한 시험 ID 목록 조회
  const submissions = await prisma.submission.findMany({
    where: { studentId: session.studentId },
    select: { examId: true },
  });
  const submittedExamIds = new Set(submissions.map((s) => s.examId));

  // 전체 시험 목록 조회
  const allExams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "asc" }],
    select: { id: true, subject: true, title: true, totalQuestions: true, startNum: true },
  });

  // 아직 제출하지 않은 미응시 시험만 필터링
  const unsubmittedExams = allExams.filter((e) => !submittedExamIds.has(e.id));

  return (
    <StudentHomeClient
      session={session}
      unsubmittedExams={unsubmittedExams}
      allExams={allExams}
    />
  );
}
