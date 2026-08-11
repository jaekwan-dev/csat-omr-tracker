"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  FileText,
  Trash2,
  Users,
  Search,
  MoreHorizontal,
  FileBarChart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUBJECT_CONFIG, type Subject, SUBJECT_BADGE_CLASS } from "@/lib/exam-data"
import { cn } from "@/lib/utils"

export interface SerializedSubmission {
  id: number
  studentId: string
  examId: number
  answers: any
  totalScore: number
  submittedAt: string
  student: {
    id: string
    name: string
    grade: number
    classNum: number
  }
}

export interface ExamWithSubmissions {
  id: number
  subject: Subject
  title: string
  totalQuestions: number
  submissions: SerializedSubmission[]
}

export function GradeListClient({ initialExams }: { initialExams: ExamWithSubmissions[] }) {
  const searchParams = useSearchParams()
  const [exams, setExams] = useState<ExamWithSubmissions[]>(initialExams)
  const [selectedExamId, setSelectedExamId] = useState<number | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [filterGrade, setFilterGrade] = useState<string>("ALL")
  const [filterClass, setFilterClass] = useState<string>("ALL")

  // Delete State
  const [pendingDelete, setPendingDelete] = useState<SerializedSubmission | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter Data
  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId)
  }, [exams, selectedExamId])

  const filteredSubmissions = useMemo(() => {
    let subs: SerializedSubmission[] = []
    if (selectedExamId === "ALL") {
      subs = exams.flatMap((e) => e.submissions)
    } else if (currentExam) {
      subs = currentExam.submissions
    }

    return subs.filter(sub => {
      if (filterGrade !== "ALL" && sub.student.grade.toString() !== filterGrade) return false
      if (filterClass !== "ALL" && sub.student.classNum.toString() !== filterClass) return false

      const q = searchQuery.toLowerCase().trim()
      if (q) {
        if (!sub.student.name.toLowerCase().includes(q) &&
          !sub.studentId.includes(q) &&
          !`${sub.student.grade}학년`.includes(q) &&
          !`${sub.student.classNum}반`.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [exams, selectedExamId, currentExam, searchQuery, filterGrade, filterClass])

  // Summary
  const summary = useMemo(() => {
    const totalSubs = filteredSubmissions.length
    if (totalSubs === 0) return { totalSubs: 0, avgScore: 0, maxScore: 0 }

    const scores = filteredSubmissions.map((s) => s.totalScore)
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalSubs) * 10) / 10
    const maxScore = Math.max(...scores)

    return { totalSubs, avgScore, maxScore }
  }, [filteredSubmissions])

  async function confirmDelete() {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/teacher/submissions/${pendingDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setExams((prev) =>
          prev.map((exam) => ({
            ...exam,
            submissions: exam.submissions.filter((s) => s.id !== pendingDelete.id)
          })).filter(exam => exam.submissions.length > 0) // 제출 내역이 0이 되면 시험목록에서 제외
        )
        if (selectedExamId !== "ALL" && currentExam && currentExam.submissions.length === 1) {
          // 마지막 제출내역이 삭제되면 "ALL"로 이동
          setSelectedExamId("ALL")
        }
        toast.success(`${pendingDelete.student.name} 학생의 제출 기록이 삭제되었습니다.`)
      } else {
        toast.error("삭제에 실패했습니다.")
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
      setPendingDelete(null)
    }
  }

  function formatDate(isoStr: string) {
    const d = new Date(isoStr)
    return d.toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      {/* <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              조회된 제출 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalSubs}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileBarChart className="size-4" />
              평균 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalSubs > 0 ? `${summary.avgScore}점` : "-"}</p>
          </CardContent>
        </Card>
        <Card className="hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="size-4" />
              최고 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalSubs > 0 ? `${summary.maxScore}점` : "-"}</p>
          </CardContent>
        </Card>
      </div> */}

      {/* Filter and Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Exam Picker Dropdown */}
        <div className="w-full md:w-auto">
          <Select
            value={selectedExamId.toString()}
            onValueChange={(val) => setSelectedExamId(val === "ALL" ? "ALL" : Number(val))}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue>
                {selectedExamId === "ALL"
                  ? "전체 시험 조회"
                  : exams.find((e) => e.id === selectedExamId)
                    ? `${exams.find((e) => e.id === selectedExamId)?.title} (${SUBJECT_CONFIG[exams.find((e) => e.id === selectedExamId)!.subject].label})`
                    : "시험을 선택하세요"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 시험 조회</SelectItem>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id.toString()}>
                  {exam.title} ({SUBJECT_CONFIG[exam.subject].label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={filterGrade} onValueChange={(v) => setFilterGrade(v || "ALL")}>
            <SelectTrigger className="w-[100px]">
              <SelectValue>
                {filterGrade === "ALL" ? "전체 학년" : `${filterGrade}학년`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 학년</SelectItem>
              <SelectItem value="1">1학년</SelectItem>
              <SelectItem value="2">2학년</SelectItem>
              <SelectItem value="3">3학년</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterClass} onValueChange={(v) => setFilterClass(v || "ALL")}>
            <SelectTrigger className="w-[90px]">
              <SelectValue>
                {filterClass === "ALL" ? "전체 반" : `${filterClass}반`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 반</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                <SelectItem key={c} value={c.toString()}>{c}반</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="학생 이름, 학번, 학년, 반 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {exams.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileBarChart />
              </EmptyMedia>
              <EmptyTitle>제출된 내역이 없습니다</EmptyTitle>
              <EmptyDescription>아직 학생들의 시험 제출 기록이 없습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : filteredSubmissions.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyTitle>검색 결과가 없습니다</EmptyTitle>
              <EmptyDescription>조건에 맞는 학생의 제출 내역이 없습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px] whitespace-nowrap">이름</TableHead>
                  <TableHead className="w-[85px] whitespace-nowrap">학년 / 반</TableHead>
                  {selectedExamId === "ALL" && <TableHead>시험</TableHead>}
                  <TableHead className="w-[60px] text-right whitespace-nowrap">점수</TableHead>
                  <TableHead className="hidden md:table-cell text-right whitespace-nowrap">제출 일시</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => {
                  const exam = exams.find(e => e.id === sub.examId)!
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-bold text-foreground whitespace-nowrap">
                        {sub.student.name}
                      </TableCell>
                      <TableCell>
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium text-muted-foreground whitespace-nowrap inline-block">
                          {sub.student.grade}학년 {sub.student.classNum}반
                        </span>
                      </TableCell>
                      {selectedExamId === "ALL" && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium line-clamp-1">{exam.title}</span>
                            <span className={cn("text-[9px] px-1 py-0.5 rounded font-bold w-fit mt-0.5", SUBJECT_BADGE_CLASS[exam.subject])}>
                              {SUBJECT_CONFIG[exam.subject].label}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right font-bold tabular-nums text-primary whitespace-nowrap">
                        {sub.totalScore}점
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                        {formatDate(sub.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon" className="size-8" />}
                          >
                            <MoreHorizontal />
                            <span className="sr-only">작업 열기</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPendingDelete(sub)}
                            >
                              <Trash2 />
                              제출 취소
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Alert */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제출 내역을 취소(삭제)하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.student.name} 학생의 해당 시험 제출 기록({pendingDelete?.totalScore}점)이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>닫기</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "제출 삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
