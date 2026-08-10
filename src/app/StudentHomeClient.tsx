"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, CheckCircle2, ChevronRight, FileText, BookOpen, Calculator, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

import StudentHeader from "@/components/StudentHeader";

const SUBJECT_META = {
  KOREAN: {
    label: "국어",
    labelEn: "KOREAN",
    icon: BookOpen,
    color: "bg-purple-400",
    text: "text-purple-500",
    border: "border-purple-200",
    bgLight: "bg-purple-50",
    gradient: "from-purple-400 to-purple-500",
  },
  MATH: {
    label: "수학",
    labelEn: "MATHEMATICS",
    icon: Calculator,
    color: "bg-orange-400",
    text: "text-orange-500",
    border: "border-orange-200",
    bgLight: "bg-orange-50",
    gradient: "from-orange-400 to-orange-500",
  },
  ENGLISH: {
    label: "영어",
    labelEn: "ENGLISH",
    icon: Globe,
    color: "bg-blue-400",
    text: "text-blue-500",
    border: "border-blue-200",
    bgLight: "bg-blue-50",
    gradient: "from-blue-400 to-blue-500",
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
          
          {/* Subject Filter Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(["KOREAN", "MATH", "ENGLISH"] as Subject[]).map((subjKey) => {
              const meta = SUBJECT_META[subjKey];
              const isActive = selectedSubjectFilter === subjKey;
              const count = unsubmittedExams.filter((e) => e.subject === subjKey).length;
              return (
                <button
                  key={subjKey}
                  onClick={() => setSelectedSubjectFilter(subjKey)}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-3.5 rounded-2xl border transition-all duration-300",
                    isActive 
                      ? cn(meta.color, "text-white border-transparent shadow-md scale-[1.02]") 
                      : "bg-secondary text-secondary-foreground border-transparent hover:border-border hover:bg-muted"
                  )}
                >
                  <meta.icon className="w-5 h-5 sm:w-4 sm:h-4 mb-0.5 sm:mb-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-bold">{meta.label}</span>
                    <span className={cn("text-[10px] sm:text-xs font-semibold", isActive ? "text-white/80" : "text-muted-foreground")}>
                      ({count})
                    </span>
                  </div>
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
            <div className="bg-card rounded-3xl p-10 text-center border border-border shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">
                {searchQuery ? "검색 조건에 일치하는 시험이 없습니다" : `현재 응시할 수 있는 ${currentMeta.label} 시험이 없습니다`}
              </h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[280px]">
                {searchQuery ? (
                  "다른 검색어를 입력하거나 검색어를 초기화해 주세요."
                ) : isAllCompleted ? (
                  <>
                    🎉 <strong className={currentMeta.text}>{currentMeta.label} 영역의 모든 시험 제출을 완료하셨습니다!</strong><br/>
                    학습 이력 탭에서 성적표를 확인해 보세요.
                  </>
                ) : (
                  "해당 과목에 아직 등록된 시험이 없습니다. 선생님이 새 시험을 등록하면 표시됩니다."
                )}
              </p>
              {isAllCompleted && !searchQuery && (
                <Link
                  href="/history"
                  className={cn("mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5", currentMeta.color)}
                >
                  <CheckCircle2 className="w-4 h-4" /> 학습 이력 바로가기
                </Link>
              )}
            </div>
          ) : (
            filteredExams.map((exam) => (
              <Link key={exam.id} href={`/exam/${exam.id}`} className="group block">
                <div
                  className={cn(
                    "rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br",
                    currentMeta.gradient
                  )}
                >
                  <div className="p-6 sm:p-7 flex flex-col gap-5">
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-sm mb-1">
                          {currentMeta.label}
                        </h2>
                        <p className="text-xs font-bold text-white/70 tracking-[0.15em]">
                          {currentMeta.labelEn}
                        </p>
                      </div>
                      
                      {/* Icon Badge */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/25 backdrop-blur-md border-[1.5px] border-white/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <currentMeta.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-sm font-bold tracking-tight">{exam.title}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-foreground transition-colors">
                        <ChevronRight className="w-6 h-6" />
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
