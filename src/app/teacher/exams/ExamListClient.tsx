"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  BarChart3,
  ClipboardList,
  Eye,
  EyeOff,
  FileQuestion,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SUBJECT_BADGE_CLASS, SUBJECT_CONFIG, type Exam, type Subject } from "@/lib/exam-data"

const FILTERS: Array<{ value: "ALL" | Subject; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "KOREAN", label: "국어" },
  { value: "MATH", label: "수학" },
  { value: "ENGLISH", label: "영어" },
]

export function ExamListClient({ initialExams }: { initialExams: Exam[] }) {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [subjectFilter, setSubjectFilter] = useState<"ALL" | Subject>("ALL")
  const [pendingDelete, setPendingDelete] = useState<Exam | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredExams = useMemo(
    () => exams.filter((e) => subjectFilter === "ALL" || e.subject === subjectFilter),
    [exams, subjectFilter],
  )

  const summary = useMemo(() => {
    const published = exams.filter((e) => e.isPublished)
    const totalSubmissions = exams.reduce((sum, e) => sum + e.stats.submissionCount, 0)
    const avgScores = published
      .filter((e) => e.stats.submissionCount > 0)
      .map((e) => e.stats.avg)
    const overallAvg =
      avgScores.length > 0
        ? Math.round((avgScores.reduce((a, b) => a + b, 0) / avgScores.length) * 10) / 10
        : 0
    return {
      total: exams.length,
      published: published.length,
      draft: exams.length - published.length,
      totalSubmissions,
      overallAvg,
    }
  }, [exams])

  async function confirmDelete() {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/teacher/exams/${pendingDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== pendingDelete.id))
        toast.success(`"${pendingDelete.title}" 시험이 삭제되었습니다.`)
      } else {
        toast.error("삭제에 실패했습니다.")
      }
    } catch {
      toast.error("오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
      setPendingDelete(null)
    }
  }

  async function togglePublish(exam: Exam) {
    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !exam.isPublished }),
      })
      if (res.ok) {
        setExams((prev) =>
          prev.map((e) => (e.id === exam.id ? { ...e, isPublished: !e.isPublished } : e))
        )
        toast.success(
          `"${exam.title}" 시험이 ${!exam.isPublished ? "게시" : "숨김"} 처리되었습니다.`
        )
      } else {
        toast.error("상태 변경에 실패했습니다.")
      }
    } catch {
      toast.error("오류가 발생했습니다.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="size-4" />
              전체 시험
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.total}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileQuestion className="size-4" />
              게시 / 임시저장
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {summary.published}
              <span className="text-base font-normal text-muted-foreground"> / {summary.draft}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              전체 응시자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalSubmissions}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="size-4" />
              평균 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{summary.overallAvg}점</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter + primary action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={subjectFilter} onValueChange={(v) => setSubjectFilter(v as "ALL" | Subject)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button render={<Link href="/teacher/exams/new" />} nativeButton={false}>
          <Plus className="size-4 mr-2" />
          시험 등록
        </Button>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {filteredExams.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>등록된 시험이 없습니다</EmptyTitle>
              <EmptyDescription>새로운 시험을 등록하고 응시 결과를 관리해보세요.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link href="/teacher/exams/new" />} nativeButton={false}>
                <Plus className="size-4 mr-2" />
                시험 등록하기
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시험</TableHead>
                <TableHead className="hidden sm:table-cell">상태</TableHead>
                <TableHead className="hidden text-right md:table-cell">응시자</TableHead>
                <TableHead className="hidden text-right md:table-cell">평균</TableHead>
                <TableHead className="hidden text-right lg:table-cell">최고 / 최저</TableHead>
                <TableHead className="text-center w-24">통계</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => {
                const cfg = SUBJECT_CONFIG[exam.subject]
                const Icon = cfg.icon
                return (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("size-9 rounded-lg border", SUBJECT_BADGE_CLASS[exam.subject])}>
                          <AvatarFallback className="rounded-lg bg-transparent">
                            <Icon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">{exam.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {cfg.label} · 총 {exam.totalQuestions}문항
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={exam.isPublished ? "default" : "secondary"}>
                        {exam.isPublished ? "게시됨" : "임시저장"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                      {exam.stats.submissionCount}명
                    </TableCell>
                    <TableCell className="hidden text-right font-medium tabular-nums md:table-cell">
                      {exam.stats.submissionCount > 0 ? `${exam.stats.avg}점` : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                      {exam.stats.submissionCount > 0
                        ? `${exam.stats.max} / ${exam.stats.min}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        disabled={exam.stats.submissionCount === 0}
                        onClick={() => router.push(`/teacher/exams/${exam.id}/stats`)}
                      >
                        <BarChart3 className="size-3 mr-1" />
                        보기
                      </Button>
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
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                            >
                              <Pencil />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => togglePublish(exam)}
                            >
                              {exam.isPublished ? <EyeOff /> : <Eye />}
                              {exam.isPublished ? "숨기기" : "게시하기"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPendingDelete(exam)}
                            >
                              <Trash2 />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시험을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.title}&quot; 시험과 관련된 모든 제출 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
