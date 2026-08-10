"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Trophy, Target, FileText, BookOpen, Calculator, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

import StudentHeader from "@/components/StudentHeader";

interface Summary {
  totalExams: number;
  overallAvgScore: number;
  highestScore: number;
  overallAccuracy: number;
}

interface SubjectStat {
  count: number;
  avgScore: number;
  highestScore: number;
  accuracy: number;
  recentScore: number;
  recentMaxScore: number;
  trend: number;
}

interface ChartItem {
  id: number;
  examId: number;
  subject: string;
  title: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  date: string;
}

const SUBJECT_META: Record<string, { label: string; icon: any; color: string; bgLight: string; text: string; gradient: string }> = {
  KOREAN: { 
    label: "국어", 
    icon: BookOpen,
    color: "bg-purple-400", 
    bgLight: "bg-purple-50", 
    text: "text-purple-500", 
    gradient: "from-purple-400 to-purple-500" 
  },
  MATH: { 
    label: "수학", 
    icon: Calculator,
    color: "bg-orange-400", 
    bgLight: "bg-orange-50", 
    text: "text-orange-500", 
    gradient: "from-orange-400 to-orange-500" 
  },
  ENGLISH: { 
    label: "영어", 
    icon: Globe,
    color: "bg-blue-400", 
    bgLight: "bg-blue-50", 
    text: "text-blue-500", 
    gradient: "from-blue-400 to-blue-500" 
  },
};

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStat>>({});
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("KOREAN");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/submissions/stats");
        const data = await res.json();
        if (res.ok && data.hasData) {
          setHasData(true);
          setSummary(data.summary);
          setSubjectStats(data.subjectStats);
          setChartData(data.chartData);
        } else {
          setHasData(false);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const filteredChartData = chartData.filter((item) => item.subject === selectedSubject);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-b from-secondary/50 to-transparent -z-10 pointer-events-none" />
      
      <StudentHeader />

      <main className="container max-w-2xl mx-auto flex-1 relative z-10 pt-6 pb-12 px-4 flex flex-col gap-6">
        
        <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            성적 통계
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            응시한 시험의 성적 지표 및 변화 추이입니다.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground">데이터를 분석하는 중...</p>
          </div>
        ) : !hasData || chartData.length === 0 ? (
          <div className="bg-card rounded-3xl p-10 text-center border border-border shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-5">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">아직 등록된 성적 데이터가 없습니다</h3>
            <p className="text-sm font-medium text-muted-foreground">홈 화면에서 시험에 응시하면 분석 그래프가 생성됩니다!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: "총 응시 시험", value: `${summary?.totalExams}회`, color: "text-blue-500", bg: "bg-blue-50" },
                { icon: Target, label: "평균 점수", value: `${summary?.overallAvgScore}점`, color: "text-indigo-500", bg: "bg-indigo-50" },
                { icon: Trophy, label: "최고 점수", value: `${summary?.highestScore}점`, color: "text-amber-500", bg: "bg-amber-50" },
                { icon: TrendingUp, label: "종합 정답률", value: `${summary?.overallAccuracy}%`, color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-card rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm border border-border">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3", item.bg, item.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-foreground mb-1 leading-none">{item.value}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-muted-foreground">{item.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Subject Filter Grid */}
            <div className="bg-card rounded-3xl p-4 border border-border shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "KOREAN", key: "KOREAN" },
                  { id: "MATH", key: "MATH" },
                  { id: "ENGLISH", key: "ENGLISH" },
                ].map((tab) => {
                  const meta = SUBJECT_META[tab.key];
                  const isActive = selectedSubject === tab.id;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedSubject(tab.id)}
                      className={cn(
                        "flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 rounded-2xl transition-all duration-300",
                        isActive 
                          ? cn(meta.bgLight, meta.text, "shadow-inner scale-[1.02]") 
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? meta.text : "opacity-70")} />
                      <span className="text-xs sm:text-sm font-bold">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Trend Chart Section */}
            <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border shadow-sm">
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> 
                  {SUBJECT_META[selectedSubject]?.label} 성적 변화 흐름
                </h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
                  응시한 시험의 획득 점수 추이입니다.
                </p>
              </div>

              {filteredChartData.length === 0 ? (
                <div className="text-center py-10 bg-secondary/50 rounded-2xl text-sm font-bold text-muted-foreground border border-dashed border-border">
                  해당 과목의 응시 기록이 없습니다.
                </div>
              ) : (
                <div className="mt-4">
                  <div className="relative h-48 w-full flex items-end gap-2 pb-6 border-b-2 border-dashed border-border/50">
                    {filteredChartData.map((item) => {
                      const meta = SUBJECT_META[item.subject] || SUBJECT_META.KOREAN;
                      const heightPercent = Math.max(item.scorePercent, 10);
                      return (
                        <div key={item.id} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group">
                          {/* Tooltip / Label */}
                          <div className={cn(
                            "text-[10px] sm:text-xs font-black mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-foreground text-background px-2 py-1 rounded-md pointer-events-none z-10 whitespace-nowrap",
                            meta.text // fallback for non-hover state if desired
                          )}>
                            {item.score}점
                          </div>
                          {/* Score Label Default */}
                          <div className={cn("text-[10px] sm:text-xs font-black mb-1 transition-colors", meta.text)}>
                            {item.score}
                          </div>
                          
                          {/* Bar Graphic */}
                          <div
                            className={cn(
                              "w-full max-w-[40px] rounded-t-xl transition-all duration-500 ease-out shadow-sm group-hover:brightness-110",
                              meta.gradient
                            )}
                            style={{ 
                              height: `${heightPercent}%`,
                              background: `var(--tw-gradient-stops)`
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X Axis Labels */}
                  <div className="flex gap-2 mt-3">
                    {filteredChartData.map((item) => (
                      <div key={item.id} className="flex-1 min-w-0 text-center">
                        <div className="text-[10px] sm:text-xs font-bold text-foreground truncate px-1">
                          {item.title}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground mt-0.5">
                          {item.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Specific Analytics Cards */}
            <div className="flex flex-col gap-4 mt-2">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" /> 과목별 상세 분석
              </h3>

              {Object.keys(SUBJECT_META).map((subjKey) => {
                const meta = SUBJECT_META[subjKey];
                const stat = subjectStats[subjKey];
                const Icon = meta.icon;

                if (!stat) {
                  return (
                    <div key={subjKey} className="bg-secondary/30 border border-dashed border-border rounded-3xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/50">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-muted-foreground">{meta.label}</div>
                        <div className="text-xs font-medium text-muted-foreground/70 mt-0.5">응시한 시험이 없습니다.</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={subjKey} className="bg-card rounded-3xl p-5 sm:p-6 shadow-sm border border-border transition-all hover:shadow-md">
                    
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner bg-gradient-to-br", meta.gradient)}>
                          <Icon className="w-6 h-6 drop-shadow-sm" />
                        </div>
                        <div>
                          <div className="text-lg font-black text-foreground leading-tight">{meta.label}</div>
                          <div className="text-xs font-bold text-muted-foreground mt-0.5">총 {stat.count}회 응시</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-muted/30 p-3 sm:p-4 rounded-2xl text-center">
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1">평균 점수</div>
                        <div className={cn("text-base sm:text-lg font-black", meta.text)}>{stat.avgScore}점</div>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1">최고 점수</div>
                        <div className="text-base sm:text-lg font-black text-foreground">{stat.highestScore}점</div>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1">최근 점수</div>
                        <div className="text-base sm:text-lg font-black text-foreground">{stat.recentScore}점</div>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1">정답률</div>
                        <div className="text-base sm:text-lg font-black text-emerald-500">{stat.accuracy}%</div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
