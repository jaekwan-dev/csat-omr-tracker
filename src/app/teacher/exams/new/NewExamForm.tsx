"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  UploadCloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buildQuestions, SUBJECT_CONFIG, type Subject, type QuestionInput } from "@/lib/exam-data"
import { SubjectPicker } from "../_components/SubjectPicker"
import { QuestionEditor } from "../_components/QuestionEditor"

export function NewExamForm() {
  const router = useRouter()
  const [subject, setSubject] = useState<Subject>("KOREAN")
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<QuestionInput[]>(() => buildQuestions("KOREAN"))
  const [explanationFile, setExplanationFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const cfg = SUBJECT_CONFIG[subject]

  useEffect(() => {
    setQuestions(buildQuestions(subject))
  }, [subject])

  function setAnswer(idx: number, answer: number) {
    setQuestions((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], correctAnswer: answer }
      return next
    })
  }

  function setScore(idx: number, score: number) {
    setQuestions((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], score }
      return next
    })
  }

  function fillAllScores(score: number) {
    setQuestions((prev) => prev.map((q) => ({ ...q, score })))
  }

  function removeQuestion() {
    setQuestions((prev) => (prev.length <= cfg.minQuestions ? prev : prev.slice(0, -1)))
  }

  function addQuestion() {
    setQuestions((prev) => {
      if (prev.length >= cfg.totalQuestions) return prev
      const nextNum = cfg.startNum + prev.length
      return [...prev, { questionNum: nextNum, correctAnswer: 1, score: cfg.scoreOptions[0], isSubjective: false }]
    })
  }

  const maxScore = useMemo(() => questions.reduce((sum, q) => sum + q.score, 0), [questions])
  const totalMismatch = cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal
  const scoreProgress = cfg.fixedTotal ? Math.min((maxScore / cfg.fixedTotal) * 100, 100) : 100

  async function handleSubmit() {
    if (!title.trim()) { setError("시험 제목을 입력하세요."); return }
    if (cfg.fixedTotal !== null && maxScore !== cfg.fixedTotal) {
      setError(`총 배점 합계가 ${cfg.fixedTotal}점이 되어야 합니다. (현재 ${maxScore}점)`)
      return
    }

    setError("")
    setSubmitting(true)
    let explanationPdfUrl: string | undefined

    try {
      if (explanationFile) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(explanationFile.name)}`, {
          method: "POST",
          body: explanationFile,
        })
        if (!uploadRes.ok) throw new Error("해설지 업로드 실패")
        const uploadData = await uploadRes.json()
        explanationPdfUrl = uploadData.url
      }

      const res = await fetch("/api/teacher/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title: title.trim(),
          startNum: cfg.startNum,
          explanationPdfUrl,
          questions,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "오류가 발생했습니다.")
      }

      toast.success(`"${title.trim()}" 시험이 등록되었습니다.`)
      router.push("/teacher/exams")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<a href="/teacher/exams" />}
            nativeButton={false}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">새 시험 등록</h1>
            <p className="text-xs text-muted-foreground">새로운 모의고사나 시험을 등록하세요.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalMismatch && (
            <Badge variant="destructive" className="hidden sm:inline-flex">
              배점을 {cfg.fixedTotal}점으로 맞춰주세요
            </Badge>
          )}
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {submitting ? "등록 중..." : "등록하기"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* LEFT: basic info */}
        <div className="flex flex-col gap-6 md:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-primary" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>과목</FieldLabel>
                  <SubjectPicker value={subject} onChange={setSubject} />
                </Field>

                <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">문항 수</span>
                    <span className="font-semibold">
                      {cfg.canDeleteQuestions
                        ? `${cfg.minQuestions}~${cfg.totalQuestions}`
                        : cfg.totalQuestions}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">배점</span>
                    <span className="font-semibold">{cfg.scoreOptions.join(", ")}점</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">만점</span>
                    <span className="font-semibold">{cfg.fixedTotal ? `${cfg.fixedTotal}점` : "자유"}</span>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="examTitle">시험 제목</FieldLabel>
                  <Input
                    id="examTitle"
                    placeholder="예: 2024년 6월 기출"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="explanationFile">해설지 PDF (선택)</FieldLabel>
                  <label
                    htmlFor="explanationFile"
                    className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-input bg-background text-center transition-colors hover:bg-muted/40"
                  >
                    <UploadCloud className="size-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {explanationFile ? (
                        <span className="font-medium text-foreground">{explanationFile.name}</span>
                      ) : (
                        "클릭하여 PDF 파일 업로드"
                      )}
                    </p>
                    <input
                      id="explanationFile"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setExplanationFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>확인이 필요합니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* RIGHT: questions */}
        <div className="flex flex-col gap-4 md:col-span-7">
          <Card className="md:sticky md:top-20 md:z-40">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">배점 합계</span>
                  <span className="text-xs text-muted-foreground">
                    {cfg.fixedTotal ? `목표 점수: ${cfg.fixedTotal}점` : "자유 배점 모드"}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={
                      totalMismatch ? "text-2xl font-bold text-destructive" : "text-2xl font-bold text-primary"
                    }
                  >
                    {maxScore}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">점</span>
                </div>
              </div>
              {cfg.fixedTotal && (
                <Progress
                  value={scoreProgress}
                  className={
                    totalMismatch
                      ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                      : "[&_[data-slot=progress-indicator]]:bg-primary"
                  }
                />
              )}
            </CardContent>
          </Card>

          <QuestionEditor
            cfg={cfg}
            questions={questions}
            onSetAnswer={setAnswer}
            onSetScore={setScore}
            onFillAllScores={fillAllScores}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
          />
        </div>
      </div>
    </div>
  )
}
