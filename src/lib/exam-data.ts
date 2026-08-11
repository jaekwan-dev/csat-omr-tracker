import { BookOpen, Calculator, Globe2, type LucideIcon } from "lucide-react"

export type Subject = "KOREAN" | "MATH" | "ENGLISH"

export interface SubjectConfig {
  label: string
  icon: LucideIcon
  colorVar: string
  totalQuestions: number
  minQuestions: number
  startNum: number
  scoreOptions: number[]
  fixedTotal: number | null
  canDeleteQuestions: boolean
}

export const SUBJECT_CONFIG: Record<Subject, SubjectConfig> = {
  KOREAN: {
    label: "국어",
    icon: BookOpen,
    colorVar: "var(--subject-korean)",
    totalQuestions: 25,
    minQuestions: 15,
    startNum: 1,
    scoreOptions: [4, 5, 6, 7],
    fixedTotal: 100,
    canDeleteQuestions: true,
  },
  MATH: {
    label: "수학",
    icon: Calculator,
    colorVar: "var(--subject-math)",
    totalQuestions: 20,
    minQuestions: 20,
    startNum: 1,
    scoreOptions: [2, 3, 4],
    fixedTotal: null,
    canDeleteQuestions: false,
  },
  ENGLISH: {
    label: "영어",
    icon: Globe2,
    colorVar: "var(--subject-english)",
    totalQuestions: 28,
    minQuestions: 28,
    startNum: 18,
    scoreOptions: [2, 3],
    fixedTotal: 63,
    canDeleteQuestions: false,
  },
}

export const SUBJECT_BADGE_CLASS: Record<Subject, string> = {
  KOREAN: "bg-subject-korean/10 text-subject-korean border-subject-korean/20",
  MATH: "bg-subject-math/10 text-subject-math border-subject-math/20",
  ENGLISH: "bg-subject-english/10 text-subject-english border-subject-english/20",
}

export interface ExamStats {
  avg: number
  max: number
  min: number
  submissionCount: number
}

export interface Exam {
  id: number
  subject: Subject
  title: string
  totalQuestions: number
  isPublished: boolean
  stats: ExamStats
}

export interface QuestionInput {
  questionNum: number
  correctAnswer: number
  score: number
  isSubjective: boolean
}

export function buildQuestions(subject: Subject): QuestionInput[] {
  const cfg = SUBJECT_CONFIG[subject]
  return Array.from({ length: cfg.totalQuestions }, (_, i) => ({
    questionNum: cfg.startNum + i,
    correctAnswer: 1,
    score: cfg.scoreOptions[0],
    isSubjective: false,
  }))
}
