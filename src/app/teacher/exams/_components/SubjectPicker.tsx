"use client"

import { cn } from "@/lib/utils"
import { SUBJECT_CONFIG, type Subject } from "@/lib/exam-data"

export function SubjectPicker({
  value,
  onChange,
  disabled,
}: {
  value: Subject
  onChange: (subject: Subject) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.entries(SUBJECT_CONFIG) as [Subject, typeof SUBJECT_CONFIG[Subject]][]).map(
        ([subject, cfg]) => {
          const isActive = value === subject
          return (
            <button
              key={subject}
              type="button"
              disabled={disabled}
              onClick={() => onChange(subject)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-medium transition-all",
                isActive
                  ? "border-transparent shadow-sm"
                  : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
                disabled && "pointer-events-none opacity-50"
              )}
              style={
                isActive
                  ? {
                      background: `color-mix(in oklch, ${cfg.colorVar} 14%, transparent)`,
                      color: cfg.colorVar,
                      borderColor: `color-mix(in oklch, ${cfg.colorVar} 30%, transparent)`,
                    }
                  : undefined
              }
            >
              <cfg.icon className="size-5" />
              <span>{cfg.label}</span>
            </button>
          )
        }
      )}
    </div>
  )
}
