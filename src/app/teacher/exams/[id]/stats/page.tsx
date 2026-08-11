import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTeacherSession } from "@/lib/teacherSession"
import { ExamStatsClient, type ExamWithStatsData } from "./ExamStatsClient"

export default async function ExamStatsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const isTeacher = await getTeacherSession()
  if (!isTeacher) {
    redirect("/teacher/login")
  }

  const { id } = await params
  const examId = parseInt(id, 10)
  if (isNaN(examId)) {
    redirect("/teacher/exams")
  }

  const examData = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { questionNum: "asc" }
      },
      submissions: {
        include: {
          student: true
        }
      }
    }
  })

  if (!examData || examData.submissions.length === 0) {
    redirect("/teacher/exams")
  }

  // Serialize dates
  const serializedExam: ExamWithStatsData = {
    ...examData,
    submissions: examData.submissions.map(sub => ({
      ...sub,
      submittedAt: sub.submittedAt.toISOString()
    }))
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 pb-12 md:p-8">
      <ExamStatsClient exam={serializedExam} />
    </div>
  )
}
