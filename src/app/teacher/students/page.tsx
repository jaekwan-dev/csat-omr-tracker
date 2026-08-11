import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTeacherSession } from "@/lib/teacherSession"
import { StudentListClient, type Student } from "./StudentListClient"

export default async function StudentManagementPage() {
  const isTeacher = await getTeacherSession()
  if (!isTeacher) {
    redirect("/teacher/login")
  }

  const initialStudents: Student[] = await prisma.student.findMany({
    orderBy: [
      { grade: "asc" },
      { classNum: "asc" },
      { id: "asc" },
    ],
    include: {
      _count: { select: { submissions: true } }
    }
  })

  return (
    <div className="mx-auto w-full max-w-5xl p-4 pb-12 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">학생 관리</h1>
          <p className="text-sm text-muted-foreground">
            학생 정보와 PIN을 관리하고 제출 현황을 확인합니다.
          </p>
        </div>

        <StudentListClient initialStudents={initialStudents} />
      </div>
    </div>
  )
}
