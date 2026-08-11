"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, CheckCircle2, ChevronRight, FileText, BookOpen, Calculator, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import StudentHeader from "@/components/StudentHeader";

const SUBJECT_META = {
  KOREAN: {
    label: "국어",
    labelEn: "KOREAN",
    icon: BookOpen,
    colorVar: "var(--color-subject-korean)",
  },
  MATH: {
    label: "수학",
    labelEn: "MATHEMATICS",
    icon: Calculator,
    colorVar: "var(--color-subject-math)",
  },
  ENGLISH: {
    label: "영어",
    labelEn: "ENGLISH",
    icon: Globe,
    colorVar: "var(--color-subject-english)",
  },
} as const;

type Subject = keyof typeof SUBJECT_META;

interface ExamItem {
  id: number;
  subject: string;
  title: string;
  totalQuestions: number;
  startNum: number;
}

interface SessionData {
  studentId: string;
  name: string;
  grade: number;
  classNum: number;
}

export default function StudentHomeClient({
  session,
  unsubmittedExams,
  allExams,
}: {
  session: SessionData;
  unsubmittedExams: ExamItem[];
  allExams: ExamItem[];
}) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<Subject>("KOREAN");
  const [searchQuery, setSearchQuery] = useState("");

  const currentMeta = SUBJECT_META[selectedSubjectFilter];

  // 과목별 미제출 시험 목록 및 필터링
  const subjectUnsubmittedExams = useMemo(() => {
    return unsubmittedExams.filter((e) => e.subject === selectedSubjectFilter);
  }, [unsubmittedExams, selectedSubjectFilter]);

  const totalSubjectExamsCount = useMemo(() => {
    return allExams.filter((e) => e.subject === selectedSubjectFilter).length;
  }, [allExams, selectedSubjectFilter]);

  const isAllCompleted = totalSubjectExamsCount > 0 && subjectUnsubmittedExams.length === 0;

  const filteredExams = useMemo(() => {
    return subjectUnsubmittedExams.filter((e) =>
      e.title.includes(searchQuery) || currentMeta.label.includes(searchQuery)
    );
  }, [subjectUnsubmittedExams, searchQuery, currentMeta]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-b from-secondary/50 to-transparent -z-10 pointer-events-none" />

      {/* Top Navigation Header */}
      <StudentHeader session={session} />

      <main className="container max-w-2xl mx-auto flex-1 relative z-10 pt-6 pb-12 px-4 flex flex-col gap-6">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            시험 선택
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            응시할 시험을 선택하고 OMR 마킹을 시작하세요.
          </p>
        </div>

        {/* Filter Control Card */}
        <div className="bg-card rounded-3xl p-4 sm:p-5 border border-border shadow-sm flex flex-col gap-4">
          
          {/* Subject Filter (Chips) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {(Object.keys(SUBJECT_META) as Subject[]).map((subjKey) => {
              const meta = SUBJECT_META[subjKey];
              const isSelected = selectedSubjectFilter === subjKey;
              const count = unsubmittedExams.filter((e) => e.subject === subjKey).length;
              return (
                <button
                  key={subjKey}
                  onClick={() => setSelectedSubjectFilter(subjKey)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 border",
                    isSelected
                      ? "border-transparent text-white shadow-md scale-105"
                      : "bg-card text-muted-foreground border-border hover:bg-secondary"
                  )}
                  style={isSelected ? { backgroundColor: meta.colorVar } : {}}
                >
                  <meta.icon className="w-4 h-4" />
                  {meta.label}
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", isSelected ? "bg-white/20" : "bg-muted")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-background rounded-2xl px-4 py-3 border border-input focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-primary/50 transition-all">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={`${currentMeta.label} 시험 제목 검색...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="p-1 hover:bg-secondary rounded-full text-muted-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Exam List Cards */}
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredExams.length === 0 ? (
            <Empty className="py-16 bg-card border-border shadow-sm rounded-3xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>
                  {searchQuery ? "검색 조건에 일치하는 시험이 없습니다" : `현재 응시할 수 있는 ${currentMeta.label} 시험이 없습니다`}
                </EmptyTitle>
                <EmptyDescription className="max-w-[280px]">
                  {searchQuery ? (
                    "다른 검색어를 입력하거나 검색어를 초기화해 주세요."
                  ) : isAllCompleted ? (
                    <>
                      🎉 <strong style={{ color: currentMeta.colorVar }}>{currentMeta.label} 영역의 모든 시험 제출을 완료하셨습니다!</strong><br/>
                      학습 이력 탭에서 성적표를 확인해 보세요.
                    </>
                  ) : (
                    "해당 과목에 아직 등록된 시험이 없습니다. 선생님이 새 시험을 등록하면 표시됩니다."
                  )}
                </EmptyDescription>
              </EmptyHeader>
              {isAllCompleted && !searchQuery && (
                <EmptyContent>
                  <Link
                    href="/history"
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: currentMeta.colorVar }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> 학습 이력 바로가기
                  </Link>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            filteredExams.map((exam) => (
              <Link key={exam.id} href={`/exam/${exam.id}`} className="group block">
                <div
                  className="rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${currentMeta.colorVar} 14%, transparent)`,
                    borderColor: `color-mix(in oklch, ${currentMeta.colorVar} 30%, transparent)`,
                  }}
                >
                  <div className="p-6 sm:p-7 flex flex-col gap-5">
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 
                          className="text-3xl sm:text-4xl font-black tracking-tighter drop-shadow-sm mb-1"
                          style={{ color: currentMeta.colorVar }}
                        >
                          {currentMeta.label}
                        </h2>
                        <p 
                          className="text-xs font-bold tracking-[0.15em] opacity-80"
                          style={{ color: currentMeta.colorVar }}
                        >
                          {currentMeta.labelEn}
                        </p>
                      </div>
                      
                      {/* Icon Badge */}
                      <div 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${currentMeta.colorVar} 25%, transparent)`,
                          borderColor: `color-mix(in oklch, ${currentMeta.colorVar} 40%, transparent)`,
                        }}
                      >
                        <currentMeta.icon className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-sm" style={{ color: currentMeta.colorVar }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div 
                        className="px-4 py-2 rounded-full border shadow-sm flex items-center gap-2"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${currentMeta.colorVar} 20%, transparent)`,
                          borderColor: `color-mix(in oklch, ${currentMeta.colorVar} 30%, transparent)`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentMeta.colorVar }} />
                        <span className="text-sm font-bold tracking-tight" style={{ color: currentMeta.colorVar }}>{exam.title}</span>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:text-white"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${currentMeta.colorVar} 15%, transparent)`,
                          color: currentMeta.colorVar,
                        }}
                      >
                        <ChevronRight className="w-6 h-6 group-hover:hidden" />
                        <ChevronRight className="w-6 h-6 hidden group-hover:block text-white" />
                        {/* A small trick to change color on hover when we use inline styles */}
                        <style>{`.group:hover .hover-bg-var { background-color: ${currentMeta.colorVar} !important; }`}</style>
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
