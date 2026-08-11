"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X, Loader2, ChevronRight, BookOpen, Calculator, Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

import StudentHeader from "@/components/StudentHeader";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

const SUBJECT_META: Record<string, { label: string; icon: any; colorVar: string }> = {
  KOREAN: { 
    label: "국어", 
    icon: BookOpen,
    colorVar: "var(--color-subject-korean)", 
  },
  MATH: { 
    label: "수학", 
    icon: Calculator,
    colorVar: "var(--color-subject-math)", 
  },
  ENGLISH: { 
    label: "영어", 
    icon: Globe,
    colorVar: "var(--color-subject-english)", 
  },
};

interface Submission {
  id: number;
  examId: number;
  subject: string;
  title: string;
  totalQuestions: number;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
}

function HistoryContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(() => {
    return searchParams.get("subject") || "KOREAN";
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/submissions/history");
        const data = await res.json();
        if (res.ok) {
          setSubmissions(data.submissions || []);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSubject = sub.subject === selectedSubjectFilter;
      const matchSearch = sub.title.includes(searchQuery) || SUBJECT_META[sub.subject]?.label.includes(searchQuery);
      return matchSubject && matchSearch;
    });
  }, [submissions, selectedSubjectFilter, searchQuery]);

  const currentMeta = SUBJECT_META[selectedSubjectFilter] || SUBJECT_META.KOREAN;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col relative overflow-x-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div 
        className="absolute top-0 left-0 right-0 h-[260px] -z-10 pointer-events-none transition-all duration-500" 
        style={{ background: `linear-gradient(to bottom, color-mix(in oklch, ${currentMeta.colorVar} 25%, transparent), transparent)` }}
      />
      
      <StudentHeader />

      <main className="container max-w-2xl mx-auto flex-1 relative z-10 pt-6 pb-12 px-4 flex flex-col gap-6">
        
        <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            학습 이력
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            제출을 완료한 시험 성적 및 채점 결과표를 조회합니다.
          </p>
        </div>

        {/* Filter Control Card */}
        <div className="bg-card rounded-3xl p-4 sm:p-5 border border-border shadow-sm flex flex-col gap-4">
          
          {/* Subject Filter Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { id: "KOREAN", key: "KOREAN" },
              { id: "MATH", key: "MATH" },
              { id: "ENGLISH", key: "ENGLISH" },
            ].map((tab) => {
              const meta = SUBJECT_META[tab.key];
              const isActive = selectedSubjectFilter === tab.id;
              const count = submissions.filter(s => s.subject === tab.id).length;
              const Icon = meta.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubjectFilter(tab.id)}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:py-3.5 rounded-2xl border transition-all duration-300",
                    isActive 
                      ? "text-white shadow-md scale-[1.02] border-transparent" 
                      : "bg-secondary text-secondary-foreground border-transparent hover:border-border hover:bg-muted"
                  )}
                  style={isActive ? { backgroundColor: meta.colorVar } : {}}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground")} />
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
          <div 
            className="flex items-center gap-2 bg-background rounded-2xl px-4 py-3 border border-input focus-within:ring-2 transition-all"
            style={{ 
              "--tw-ring-color": `color-mix(in oklch, ${currentMeta.colorVar} 30%, transparent)`,
            } as React.CSSProperties}
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={`${currentMeta.label} 제출 시험 검색...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-foreground"
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

        {/* Loading / Empty / Filtered List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: currentMeta.colorVar }} />
            <p className="text-sm font-bold text-muted-foreground">이력을 불러오는 중...</p>
          </div>
        ) : submissions.length === 0 ? (
          <Empty className="min-h-[300px] border-none bg-card rounded-3xl shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>아직 제출한 시험이 없습니다</EmptyTitle>
              <EmptyDescription>
                홈 화면에서 시험에 응시해 첫 성적표를 받아보세요!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : filteredSubmissions.length === 0 ? (
          <Empty className="min-h-[300px] border-none bg-card rounded-3xl shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>조회된 시험 결과가 없습니다</EmptyTitle>
              <EmptyDescription>
                {searchQuery ? "입력하신 검색어와 일치하는 시험이 없습니다." : "선택한 과목에 응시 완료한 시험이 없습니다."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredSubmissions.map((sub) => {
              const meta = SUBJECT_META[sub.subject] || SUBJECT_META.KOREAN;
              const scorePercent = sub.maxScore > 0 ? (sub.totalScore / sub.maxScore) * 100 : 0;
              const Icon = meta.icon;
              
              return (
                <Link 
                  key={sub.id} 
                  href={`/result/${sub.id}`} 
                  className="group block"
                  style={{ "--subject-color": meta.colorVar } as React.CSSProperties}
                >
                  <div 
                    className="bg-card rounded-3xl p-4 sm:p-5 shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[var(--subject-color)] flex gap-4 sm:gap-5 items-center"
                  >
                    
                    <div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${meta.colorVar} 15%, transparent)`,
                        color: meta.colorVar
                      }}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-sm" />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-[11px] sm:text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                        <span 
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${meta.colorVar} 10%, transparent)`,
                            color: meta.colorVar
                          }}
                        >
                          {meta.label}
                        </span>
                        <span>•</span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-foreground mb-1 truncate group-hover:text-[var(--subject-color)] transition-colors">
                        {sub.title}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        총 {sub.totalQuestions}문항
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <div className="flex items-baseline gap-0.5">
                        <span className={cn(
                          "text-xl sm:text-2xl font-black tracking-tighter",
                          scorePercent >= 90 ? "text-emerald-600" : "text-foreground"
                        )}>
                          {sub.totalScore}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground">/{sub.maxScore}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-[var(--subject-color)] group-hover:translate-x-1 transition-all mt-1" />
                    </div>
                    
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/20" />}>
      <HistoryContent />
    </Suspense>
  );
}
