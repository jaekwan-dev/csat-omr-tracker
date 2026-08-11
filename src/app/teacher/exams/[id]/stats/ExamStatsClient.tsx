"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  FileQuestion,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUBJECT_CONFIG, type Subject } from "@/lib/exam-data"

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

export interface ExamWithStatsData {
  id: number
  subject: Subject
  title: string
  totalQuestions: number
  questions: {
    id: number
    questionNum: number
    isSubjective: boolean
    correctAnswer: number
    score: number
  }[]
  submissions: SerializedSubmission[]
}

export function ExamStatsClient({ exam }: { exam: ExamWithStatsData }) {
  const [activeTab, setActiveTab] = useState<"analysis" | "ranking">("analysis")
  const [correctRateSort, setCorrectRateSort] = useState<"none" | "asc" | "desc">("none")
  const [filterGrade, setFilterGrade] = useState<string>("ALL")
  const [filterClass, setFilterClass] = useState<string>("ALL")
  
  const cfg = SUBJECT_CONFIG[exam.subject]

  // Summary stats
  const totalSubs = exam.submissions.length
  const scores = exam.submissions.map((s) => s.totalScore)
  const avgScore = totalSubs > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / totalSubs) * 10) / 10 : 0
  const maxScore = totalSubs > 0 ? Math.max(...scores) : 0

  // 1. 문항별 분석 (Question Analysis)
  const questionStats = useMemo(() => {
    const stats = exam.questions.map((q) => {
      let correctCount = 0
      
      exam.submissions.forEach((sub) => {
        const studentAnswerStr = sub.answers[q.questionNum.toString()]
        const studentAnswer = studentAnswerStr !== undefined ? Number(studentAnswerStr) : -1
        
        if (studentAnswer === q.correctAnswer) {
          correctCount++
        }
      })

      const correctRate = totalSubs > 0 ? Math.round((correctCount / totalSubs) * 100) : 0
      
      return {
        ...q,
        correctCount,
        correctRate
      }
    })

    if (correctRateSort === "asc") {
      return stats.sort((a, b) => a.correctRate - b.correctRate)
    } else if (correctRateSort === "desc") {
      return stats.sort((a, b) => b.correctRate - a.correctRate)
    }
    return stats
  }, [exam, correctRateSort, totalSubs])

  // 2. 학생 석차 (Student Rankings)
  const rankedStudents = useMemo(() => {
    // 1. 필터 적용
    const filtered = exam.submissions.filter(s => {
      if (filterGrade !== "ALL" && s.student.grade.toString() !== filterGrade) return false
      if (filterClass !== "ALL" && s.student.classNum.toString() !== filterClass) return false
      return true
    })

    // 2. 점수 내림차순 정렬
    const sorted = [...filtered].sort((a, b) => b.totalScore - a.totalScore)
    
    // 3. 석차 부여
    let currentRank = 1
    return sorted.map((s, i) => {
      if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) {
        currentRank = i + 1
      }
      return {
        ...s,
        rank: currentRank
      }
    })
  }, [exam, filterGrade, filterClass])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/teacher/exams" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{exam.title} 통계</h1>
          <p className="text-xs text-muted-foreground">
            {cfg.label} · 총 {exam.totalQuestions}문항
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              총 응시자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{totalSubs}명</p>
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
            <p className="text-2xl font-semibold tabular-nums">{avgScore}점</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileQuestion className="size-4" />
              최고 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{maxScore}점</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="analysis">문항별 분석</TabsTrigger>
          <TabsTrigger value="ranking">학생 석차</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">문항</TableHead>
                    <TableHead className="w-20 text-center">배점</TableHead>
                    <TableHead className="w-20 text-center">정답</TableHead>
                    <TableHead className="text-right">정답자 수</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => {
                          setCorrectRateSort(prev => 
                            prev === "none" ? "desc" : prev === "desc" ? "asc" : "none"
                          )
                        }}
                      >
                        <span>정답률</span>
                        <ArrowUpDown className="ml-2 size-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionStats.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-center font-bold">{q.questionNum}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{q.score}점</TableCell>
                      <TableCell className="text-center font-bold text-primary">{q.correctAnswer}</TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground tabular-nums">
                        {q.correctCount}명
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums font-bold">{q.correctRate}%</span>
                          {q.correctRate < 40 && (
                            <Badge variant="destructive" className="px-1.5 text-[10px]">취약</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b bg-muted/20">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">석차</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>학년 / 반</TableHead>
                    <TableHead className="text-right">총점</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center size-6 rounded-full text-xs font-bold",
                          s.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {s.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">{s.student.name}</TableCell>
                      <TableCell>
                        <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground">
                          {s.student.grade}학년 {s.student.classNum}반
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary tabular-nums">
                        {s.totalScore}점
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
