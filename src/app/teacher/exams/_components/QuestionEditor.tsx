"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { QuestionInput, SubjectConfig } from "@/lib/exam-data"

export function QuestionEditor({
  cfg,
  questions,
  onSetAnswer,
  onSetScore,
  onFillAllScores,
  onAddQuestion,
  onRemoveQuestion,
}: {
  cfg: SubjectConfig
  questions: QuestionInput[]
  onSetAnswer: (index: number, answer: number) => void
  onSetScore: (index: number, score: number) => void
  onFillAllScores: (score: number) => void
  onAddQuestion: () => void
  onRemoveQuestion: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header: title + bulk score setter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">정답 및 배점</h2>
          <Badge variant="secondary">총 {questions.length}문항</Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">일괄 배점</span>
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            {cfg.scoreOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onFillAllScores(s)}
                className="rounded px-2 py-1 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                {s}점
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Remove rows (only Korean) */}
      {cfg.canDeleteQuestions && (
        <div className="flex items-center justify-between border-b bg-accent/30 px-4 py-2.5">
          <span className="text-xs font-medium text-accent-foreground">문항 수를 조절할 수 있습니다</span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questions.length <= cfg.minQuestions}
              onClick={onRemoveQuestion}
            >
              <Minus className="size-3 mr-1" />
              삭제
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={questions.length >= cfg.totalQuestions}
              onClick={onAddQuestion}
            >
              <Plus className="size-3 mr-1" />
              추가
            </Button>
          </div>
        </div>
      )}

      {/* Question rows */}
      <div className="divide-y">
        {questions.map((q, i) => (
          <div
            key={q.questionNum}
            className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4 hover:bg-muted/20 transition-colors"
          >
            {/* Q number badge */}
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
              style={{
                background: `color-mix(in oklch, ${cfg.colorVar} 14%, transparent)`,
                color: cfg.colorVar,
              }}
            >
              {q.questionNum}
            </div>

            {/* Answer picker */}
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">정답</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSetAnswer(i, c)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      q.correctAnswer === c
                        ? "text-white scale-105 shadow"
                        : "bg-background border border-input text-muted-foreground hover:border-foreground/30 hover:bg-muted"
                    )}
                    style={
                      q.correctAnswer === c
                        ? { background: cfg.colorVar }
                        : undefined
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Score picker */}
            <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
              <span className="text-[11px] font-medium text-muted-foreground">배점</span>
              <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
                {cfg.scoreOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSetScore(i, s)}
                    className={cn(
                      "min-w-8 rounded-md px-2 py-1 text-xs font-bold transition-all",
                      q.score === s
                        ? "bg-background shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    style={q.score === s ? { color: cfg.colorVar } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
