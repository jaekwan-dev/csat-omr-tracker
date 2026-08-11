"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  FileUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  Download,
  AlertCircle,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface Student {
  id: string
  name: string
  grade: number
  classNum: number
  pinCode: string
  _count: { submissions: number }
}

export function StudentListClient({ initialStudents }: { initialStudents: Student[] }) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterGrade, setFilterGrade] = useState<string>("ALL")
  const [filterClass, setFilterClass] = useState<string>("ALL")
  const [showPinIdMap, setShowPinIdMap] = useState<Record<string, boolean>>({})

  // Modals state
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD")
  const [formId, setFormId] = useState("")
  const [formName, setFormName] = useState("")
  const [formPin, setFormPin] = useState("")
  const [formGrade, setFormGrade] = useState("")
  const [formClass, setFormClass] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvError, setCsvError] = useState("")

  // Filter
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (filterGrade !== "ALL" && s.grade.toString() !== filterGrade) return false
      if (filterClass !== "ALL" && s.classNum.toString() !== filterClass) return false

      const q = searchQuery.toLowerCase().trim()
      if (q) {
        if (!s.name.toLowerCase().includes(q) &&
            !s.id.includes(q) &&
            !`${s.grade}학년`.includes(q) &&
            !`${s.classNum}반`.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [students, searchQuery, filterGrade, filterClass])

  // Helpers
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/students")
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  function openAddModal() {
    setModalMode("ADD")
    setFormId("")
    setFormName("")
    setFormGrade("1")
    setFormClass("1")
    setFormPin("0000")
    setFormError("")
    setIsFormModalOpen(true)
  }

  function openEditModal(student: Student) {
    setModalMode("EDIT")
    setFormId(student.id)
    setFormName(student.name)
    setFormPin(student.pinCode)
    setFormGrade(String(student.grade))
    setFormClass(String(student.classNum))
    setFormError("")
    setIsFormModalOpen(true)
  }

  const toggleShowPin = (id: string) => {
    setShowPinIdMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Handlers
  async function confirmDelete() {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/teacher/students/${pendingDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== pendingDelete.id))
        toast.success(`학번 ${pendingDelete.id} 학생이 삭제되었습니다.`)
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formId || !formName || !formGrade || !formClass || !formPin) {
      setFormError("모든 필드를 입력해 주세요.")
      return
    }

    setFormSubmitting(true)
    setFormError("")

    try {
      const url = modalMode === "ADD" ? "/api/teacher/students" : `/api/teacher/students/${formId}`
      const method = modalMode === "ADD" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId,
          name: formName,
          pinCode: formPin,
          grade: Number(formGrade),
          classNum: Number(formClass),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || "저장 중 오류가 발생했습니다.")
      } else {
        toast.success(
          modalMode === "ADD" ? "새 학생이 등록되었습니다." : "학생 정보가 수정되었습니다."
        )
        setIsFormModalOpen(false)
        await fetchStudents()
      }
    } catch {
      setFormError("네트워크 오류가 발생했습니다.")
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleCsvUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!csvFile) {
      setCsvError("CSV 파일을 선택해주세요.")
      return
    }

    setCsvUploading(true)
    setCsvError("")

    try {
      const formData = new FormData()
      formData.append("file", csvFile)

      const res = await fetch("/api/teacher/students/bulk", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setCsvError(data.error || "업로드에 실패했습니다.")
      } else {
        toast.success(`${data.count}명의 학생이 성공적으로 등록되었습니다.`)
        setIsCsvModalOpen(false)
        setCsvFile(null)
        await fetchStudents()
      }
    } catch {
      setCsvError("네트워크 오류가 발생했습니다.")
    } finally {
      setCsvUploading(false)
    }
  }

  function downloadCsvTemplate() {
    const csvContent = "학번,이름,학년,반\n1101,홍길동,1,1\n1102,김철수,1,1\n"
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "학생일괄등록양식.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  // Summary
  const activeStudents = students.filter((s) => s._count.submissions > 0).length

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              전체 학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{students.length}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileUp className="size-4" />
              답안 제출 이력 있음
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{activeStudents}명</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Select value={filterGrade} onValueChange={(v) => setFilterGrade(v || "ALL")}>
              <SelectTrigger className="w-[100px] bg-background">
                <SelectValue placeholder="학년" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 학년</SelectItem>
                <SelectItem value="1">1학년</SelectItem>
                <SelectItem value="2">2학년</SelectItem>
                <SelectItem value="3">3학년</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={(v) => setFilterClass(v || "ALL")}>
              <SelectTrigger className="w-[90px] bg-background">
                <SelectValue placeholder="반" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 반</SelectItem>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
                  <SelectItem key={c} value={c.toString()}>{c}반</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="이름, 학번, 학년, 반 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)}>
            <FileUp className="size-4 mr-2" />
            CSV 일괄 등록
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="size-4 mr-2" />
            새 학생 등록
          </Button>
        </div>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {filteredStudents.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>등록된 학생이 없습니다</EmptyTitle>
              <EmptyDescription>
                {searchQuery
                  ? "검색 조건에 해당되는 학생이 없습니다."
                  : "새 학생 등록 버튼을 눌러 추가하세요."}
              </EmptyDescription>
            </EmptyHeader>
            {!searchQuery && (
              <EmptyContent>
                <Button onClick={openAddModal}>
                  <Plus className="size-4 mr-2" />새 학생 등록하기
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>학번</TableHead>
                    <TableHead>학년/반</TableHead>
                    <TableHead>PIN 번호</TableHead>
                    <TableHead className="text-right">제출 기록</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => {
                    const isPinVisible = !!showPinIdMap[s.id]
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 rounded-md bg-primary/10 text-primary font-bold">
                              <AvatarFallback className="bg-transparent">{s.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{s.id}</TableCell>
                        <TableCell>
                          <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground">
                            {s.grade}학년 {s.classNum}반
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm tracking-widest bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                              {isPinVisible ? s.pinCode : "••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-foreground"
                              onClick={() => toggleShowPin(s.id)}
                            >
                              {isPinVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {s._count.submissions > 0 ? (
                            <Link href={`/teacher/grades?q=${s.id}`} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                              {s._count.submissions}건
                            </Link>
                          ) : (
                            "없음"
                          )}
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
                                <DropdownMenuItem onClick={() => openEditModal(s)}>
                                  <Pencil />
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setPendingDelete(s)}
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
            </div>

            {/* Mobile Card Grid */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredStudents.map((s) => {
                const isPinVisible = !!showPinIdMap[s.id]
                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-lg bg-primary/10 text-primary font-bold">
                          <AvatarFallback className="bg-transparent">{s.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{s.name}</span>
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                              {s.grade}학년 {s.classNum}반
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.id}</div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="size-8 -mr-2" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(s)}>
                            <Pencil /> 수정
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(s)}>
                            <Trash2 /> 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">PIN</span>
                        <span className="font-mono font-medium tracking-widest text-primary">
                          {isPinVisible ? s.pinCode : "••••"}
                        </span>
                        <button
                          onClick={() => toggleShowPin(s.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isPinVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        제출 {s._count.submissions > 0 ? (
                          <Link href={`/teacher/grades?q=${s.id}`} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                            {s._count.submissions}건
                          </Link>
                        ) : (
                          "0건"
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* Delete Alert */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>학생 정보를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.name}&quot; ({pendingDelete?.id}) 학생의 정보와 관련된 제출 이력({pendingDelete?._count.submissions}건)이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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

      {/* Custom Form Modal for Add/Edit */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {modalMode === "ADD" ? <UserPlus className="size-5" /> : <Pencil className="size-5" />}
                  {modalMode === "ADD" ? "새 학생 등록" : "학생 정보 수정"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsFormModalOpen(false)} className="size-8 -mr-2">
                  <X />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <FieldGroup>
                  <Field>
                    <FieldLabel>학번 (4자리)</FieldLabel>
                    <Input
                      type="text"
                      placeholder="예: 1101"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.replace(/\D/g, ""))}
                      disabled={modalMode === "EDIT"}
                      maxLength={4}
                      autoFocus
                    />
                  </Field>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>이름</FieldLabel>
                      <Input
                        type="text"
                        placeholder="홍길동"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>PIN (4자리)</FieldLabel>
                      <Input
                        type="text"
                        maxLength={4}
                        placeholder="1234"
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                        className="font-mono tracking-widest"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>학년</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        value={formGrade}
                        onChange={(e) => setFormGrade(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>반</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={formClass}
                        onChange={(e) => setFormClass(e.target.value)}
                      />
                    </Field>
                  </div>
                </FieldGroup>

                {formError && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle />
                    <AlertTitle className="text-xs">확인이 필요합니다</AlertTitle>
                    <AlertDescription className="text-xs">{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormModalOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" className="flex-1" disabled={formSubmitting}>
                    {formSubmitting ? "저장 중..." : "저장하기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CSV Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileUp className="size-5" />
                  CSV 대량 등록
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsCsvModalOpen(false)} className="size-8 -mr-2">
                  <X />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 text-sm text-muted-foreground">
                <p>엑셀/CSV 양식을 업로드하여 여러 명의 학생을 한 번에 등록합니다.</p>
                <p className="mt-1 text-xs">최초 PIN 번호는 자동으로 <strong className="text-foreground">0000</strong>으로 설정됩니다.</p>
              </div>

              <form onSubmit={handleCsvUpload} className="flex flex-col gap-4">
                <div className="p-6 bg-muted/40 rounded-xl border-2 border-dashed border-border text-center flex justify-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="max-w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                    onClick={downloadCsvTemplate}
                  >
                    <Download className="size-3 mr-1" />
                    표준 CSV 양식 다운로드
                  </Button>
                </div>

                {csvError && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle />
                    <AlertTitle className="text-xs">오류</AlertTitle>
                    <AlertDescription className="text-xs">{csvError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCsvModalOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" className="flex-1" disabled={csvUploading || !csvFile}>
                    {csvUploading ? "업로드 중..." : "일괄 업로드"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
