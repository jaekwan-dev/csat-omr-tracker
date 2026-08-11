import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTeacherSession } from "@/lib/teacherSession"
import { GradeListClient, type ExamWithSubmissions } from "./GradeListClient"

export default async function GradeManagementPage() {
  const isTeacher = await getTeacherSession()
  if (!isTeacher) {
    redirect("/teacher/login")
  }

  // 제출 내역이 있는 시험 목록 및 해당 제출 내역(학생 정보 포함) 가져오기
  const examsWithSubmissionsData = await prisma.exam.findMany({
    where: {
      submissions: {
        some: {} // 제출이 하나라도 있는 시험만
      }
    },
    orderBy: { id: "desc" },
    include: {
      submissions: {
        orderBy: { totalScore: "desc" }, // 기본적으로 점수 높은 순 정렬
        include: {
          student: true
        }
      }
    }
  })

  // Date 객체를 직렬화 가능한 string으로 변환
  const examsWithSubmissions: ExamWithSubmissions[] = examsWithSubmissionsData.map(exam => ({
    ...exam,
    submissions: exam.submissions.map(sub => ({
      ...sub,
      submittedAt: sub.submittedAt.toISOString()
    }))
  }))

  return (
    <div className="mx-auto w-full max-w-5xl p-4 pb-12 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">성적 관리</h1>
          <p className="text-sm text-muted-foreground">
            시험별 학생들의 제출 내역을 확인하고 관리합니다.
          </p>
        </div>

        <GradeListClient initialExams={examsWithSubmissions} />
      </div>
    </div>
  )
}
