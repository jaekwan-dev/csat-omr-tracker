"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { BookOpen, Calculator, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────────────────── */

interface Exam { id: number; subject: string; title: string; totalQuestions: number; }
interface HistoryItem { examId: number; title: string; subject: string; totalScore: number; maxScore: number; percent: number; rank: number; }
interface ResultRow {
  studentId: string; studentName: string; grade: number; classNum: number;
  totalScore: number; maxScore: number; percent: number; rank: number;
  correctCount: number; wrongCount: number; unansweredCount: number;
  submittedAt: string;
}
interface QuestionStat { questionNum: number; correctAnswer: number; score: number; correctCount: number; wrongCount: number; correctRate: number; }
interface DashboardData { exam: Exam; avgScore: number; maxScore: number; results: ResultRow[]; questionStats: QuestionStat[]; }

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };
const SUBJECT_ICON: Record<string, any> = { KOREAN: BookOpen, MATH: Calculator, ENGLISH: Globe };
const SUBJECT_COLOR_HEX: Record<string, string> = { 
  KOREAN: "#c084fc", // purple-400
  MATH: "#fb923c",   // orange-400
  ENGLISH: "#60a5fa" // blue-400
};

/* ── Question Stats Section ──────────────────────────────────────────── */
function QuestionStatsSection({ stats, colorHex }: { stats: QuestionStat[]; colorHex: string }) {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? stats : stats.slice(0, 15);

  return (
    <div className="flex flex-col gap-4">
      {/* Legend / Filter */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <span className="text-sm font-bold text-foreground mr-2">빠른 필터: </span>
        {[
          { label: "전체보기", color: "bg-secondary text-secondary-foreground" },
          { label: "오답률 50%↑ (위험)", color: "bg-red-50 text-red-600 border-red-100" },
          { label: "오답률 20~50% (주의)", color: "bg-amber-50 text-amber-600 border-amber-100" },
        ].map((f) => (
          <button key={f.label} className={cn("px-3.5 py-1.5 rounded-full border text-[13px] font-bold transition-all hover:opacity-80", f.color)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border/60">
              {["번호", "정답", "배점", "정답률"].map((h) => (
                <th key={h} className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((q) => {
              const isHard = q.correctRate < 50;
              const isMedium = q.correctRate >= 50 && q.correctRate < 80;
              const rowBg = isHard ? "bg-red-50/30" : isMedium ? "bg-amber-50/30" : "bg-card";
              const barColor = isHard ? "bg-red-400" : isMedium ? "bg-amber-400" : "bg-teal-400";
              const textBarColor = isHard ? "text-red-500" : isMedium ? "text-amber-500" : "text-teal-500";
              return (
                <tr key={q.questionNum} className={cn("border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors", rowBg)}>
                  <td className={cn("px-5 py-3 font-black text-sm", isHard ? "text-red-600" : "text-foreground")}>
                    {q.questionNum}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex w-7 h-7 rounded-full items-center justify-center font-bold text-[13px]"
                      style={{ background: `${colorHex}15`, color: colorHex }}
                    >
                      {q.correctAnswer}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-[13px] font-medium">{q.score}점</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[13px] font-black", textBarColor)}>{q.correctRate}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stats.length > 15 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="self-center mt-2 px-6 py-2.5 rounded-full text-[13px] font-bold bg-background border shadow-sm transition-all hover:bg-accent"
          style={{ borderColor: `${colorHex}44`, color: colorHex }}
        >
          {showAll ? "▲ 통계 접기" : `▼ 전체 ${stats.length}문항 보기`}
        </button>
      )}
    </div>
  );
}

// ── Simple SVG Line Chart ──────────────────────────────────
function ScoreLineChart({ history }: { history?: HistoryItem[] }) {
  const safeHistory = Array.isArray(history) ? history : [];
  if (safeHistory.length < 2) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm font-medium">
        최소 2개 이상의 시험 제출 이력이 있어야 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 480, H = 200;
  const pad = { top: 24, right: 24, bottom: 40, left: 40 };
  const inner = { w: W - pad.left - pad.right, h: H - pad.top - pad.bottom };

  const subjects = ["KOREAN", "MATH", "ENGLISH"] as const;
  const bySubject: Record<string, HistoryItem[]> = { KOREAN: [], MATH: [], ENGLISH: [] };
  safeHistory.forEach((h) => { if (bySubject[h.subject]) bySubject[h.subject].push(h); });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        {subjects.map((subj) => (
          <linearGradient key={`grad-${subj}`} id={`grad-${subj}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SUBJECT_COLOR_HEX[subj]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={SUBJECT_COLOR_HEX[subj]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {[0, 25, 50, 75, 100].map((v) => {
        const y = pad.top + inner.h - (v / 100) * inner.h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + inner.w} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? "none" : "4 4"} />
            <text x={pad.left - 10} y={y + 3} fontSize={10} fontWeight="bold" textAnchor="end" fill="var(--muted-foreground)">{v}</text>
          </g>
        );
      })}

      {subjects.map((subj) => {
        const items = bySubject[subj];
        if (items.length < 1) return null;
        const color = SUBJECT_COLOR_HEX[subj];

        const pts = items.map((item, i) => {
          const x = pad.left + (i / Math.max(items.length - 1, 1)) * inner.w;
          const y = pad.top + inner.h - (item.percent / 100) * inner.h;
          return { x, y, item };
        });

        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        const areaD = `${pathD} L ${pts[pts.length - 1].x} ${pad.top + inner.h} L ${pts[0].x} ${pad.top + inner.h} Z`;

        return (
          <g key={subj}>
            <path d={areaD} fill={`url(#grad-${subj})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5.5} fill={color} stroke="var(--card)" strokeWidth={2.5} />
                <text x={p.x} y={p.y - 12} fontSize={11} textAnchor="middle" fill={color} fontWeight="900">
                  {p.item.totalScore}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Dashboard Client ─────────────────────────────────
export default function DashboardClient({ exams }: { exams: Exam[] }) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("KOREAN");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"rank" | "studentId" | "name" | "percent">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyStudentName, setHistoryStudentName] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => e.subject === selectedSubjectFilter);
  }, [exams, selectedSubjectFilter]);

  useEffect(() => {
    if (filteredExams.length > 0) {
      const exists = filteredExams.some((e) => e.id === selectedExamId);
      if (!exists) {
        setSelectedExamId(filteredExams[0].id);
      }
    } else {
      setSelectedExamId(null);
    }
  }, [filteredExams, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId) { setData(null); return; }
    setLoading(true);
    setSelectedStudentId(null);
    setHistory(null);
    fetch(`/api/teacher/dashboard?examId=${selectedExamId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedExamId]);

  async function handleStudentClick(studentId: string, studentName: string) {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null); setHistory(null); return;
    }
    setSelectedStudentId(studentId);
    setHistoryStudentName(studentName);
    setHistoryLoading(true);
    const r = await fetch(`/api/teacher/dashboard?studentId=${studentId}`);
    const d = await r.json();
    setHistory(d.history ?? []);
    setHistoryLoading(false);
  }

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  }

  const classStats = useMemo(() => {
    if (!data || !data.results) return { counts: {}, total: 0 };
    const counts: Record<number, number> = {};
    data.results.forEach((r) => {
      counts[r.classNum] = (counts[r.classNum] || 0) + 1;
    });
    return { counts, total: data.results.length };
  }, [data]);

  const classNumbers = Object.keys(classStats.counts).map(Number).sort((a, b) => a - b);

  const rows = useMemo(() => {
    if (!data || !data.results) return [];
    let arr = [...data.results];
    if (filterClass !== null) arr = arr.filter((r) => r.classNum === filterClass);

    arr.sort((a, b) => {
      let valA, valB;
      if (sortBy === "rank") { valA = a.rank; valB = b.rank; }
      else if (sortBy === "studentId") { valA = a.studentId; valB = b.studentId; }
      else if (sortBy === "name") { valA = a.studentName; valB = b.studentName; }
      else { valA = a.percent; valB = b.percent; }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, filterClass, sortBy, sortDir]);

  const subjectColor = SUBJECT_COLOR_HEX[selectedSubjectFilter] || "#0f766e";

  function SortIcon({ field }: { field: typeof sortBy }) {
    if (sortBy !== field) return <span className="text-muted-foreground/30 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">성적 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">시험별 성적 통계와 학생별 점수를 확인하세요.</p>
      </div>

      {/* Smart Filter Card */}
      <div className="bg-card rounded-3xl p-4 sm:p-5 border border-border shadow-sm mb-6 flex flex-col gap-4 sm:gap-5">
        
        {/* 1. Subject Filters */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { id: "KOREAN", label: "국어", icon: SUBJECT_ICON.KOREAN },
            { id: "MATH", label: "수학", icon: SUBJECT_ICON.MATH },
            { id: "ENGLISH", label: "영어", icon: SUBJECT_ICON.ENGLISH },
          ].map((tab) => {
            const isActive = selectedSubjectFilter === tab.id;
            const activeColor = SUBJECT_COLOR_HEX[tab.id];
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSubjectFilter(tab.id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-3.5 rounded-2xl border transition-all duration-300",
                  isActive
                    ? "text-white border-transparent shadow-md scale-[1.02]"
                    : "bg-secondary text-secondary-foreground border-transparent hover:border-border hover:bg-muted"
                )}
                style={isActive ? { background: activeColor } : undefined}
              >
                <Icon className="w-5 h-5 sm:w-4 sm:h-4 mb-0.5 sm:mb-0" />
                <span className="text-xs sm:text-sm font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Exam List */}
        {filteredExams.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold text-foreground mb-1 px-1">시험 선택</div>
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredExams.map((e) => {
                const isActive = selectedExamId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExamId(e.id)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left w-full",
                      isActive
                        ? "shadow-md bg-card ring-1"
                        : "bg-secondary/30 border-transparent hover:border-border hover:bg-secondary/80"
                    )}
                    style={isActive ? { borderColor: subjectColor, "--tw-ring-color": subjectColor } as React.CSSProperties : undefined}
                  >
                    <div
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0"
                      style={{ background: isActive ? `${subjectColor}15` : "var(--secondary)", color: isActive ? subjectColor : "var(--muted-foreground)" }}
                    >
                      {SUBJECT_LABEL[e.subject]}
                    </div>
                    <div className={cn("text-sm font-bold truncate flex-1", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {e.title}
                    </div>
                    {isActive && <div className="text-xs font-black shrink-0 pr-2" style={{ color: subjectColor }}>✓ 선택됨</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {filteredExams.length === 0 && (
          <div className="bg-secondary/50 rounded-2xl p-4 text-center text-sm font-medium text-muted-foreground border border-transparent">
            등록된 {SUBJECT_LABEL[selectedSubjectFilter]} 시험이 없습니다.
          </div>
        )}

        {/* 3. Class Filter */}
        {data && classNumbers.length > 0 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border flex-wrap">
            <span className="text-sm font-bold text-foreground">반별 조회</span>
            <select
              value={filterClass === null ? "ALL" : filterClass}
              onChange={(e) => setFilterClass(e.target.value === "ALL" ? null : Number(e.target.value))}
              className="px-4 py-2.5 rounded-2xl border border-border bg-card text-sm font-bold text-foreground outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-ring/30 transition-all flex-1 sm:flex-none"
              style={{ borderColor: filterClass !== null ? subjectColor : undefined }}
            >
              <option value="ALL">🏫 전체 반 조회 (총 {classStats.total}명)</option>
              {classNumbers.map((c) => (
                <option key={c} value={c}>
                  📍 {c}반 ({classStats.counts[c] || 0}명)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Metric Summary */}
      {data && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: "선택 시험", value: `${data.exam.title}`, icon: "📄" },
            { label: "총 응시자", value: `${rows.length}명`, icon: "👥" },
            { label: "평균 점수", value: `${data.avgScore}점`, isAccent: true, icon: "📊" },
            { label: "최고 점수", value: `${rows[0]?.totalScore ?? 0}점`, icon: "🏆" },
          ].map((k) => (
            <div key={k.label} className={cn(
              "flex flex-col p-4 sm:p-5 rounded-3xl border shadow-sm transition-all duration-300",
              k.isAccent ? "border-transparent text-white shadow-md" : "bg-card border-border"
            )} style={k.isAccent ? { background: `linear-gradient(135deg, ${subjectColor}ee, ${subjectColor})` } : undefined}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className={cn("text-xs sm:text-sm font-bold", k.isAccent ? "text-white/90" : "text-muted-foreground")}>{k.label}</span>
                <span className={cn("text-lg", k.isAccent ? "opacity-90" : "opacity-50")}>{k.icon}</span>
              </div>
              <div className={cn("text-xl sm:text-2xl font-black tracking-tight", k.isAccent ? "text-white" : "text-foreground")}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading / Empty States */}
      {loading && (
        <div className="bg-card rounded-3xl p-16 text-center border border-border flex flex-col items-center gap-3 shadow-sm mb-8">
          <div className="spinner mb-2 w-8 h-8" style={{ borderTopColor: subjectColor }} />
          <div className="text-sm font-bold text-muted-foreground">성적 데이터를 분석하는 중입니다...</div>
        </div>
      )}

      {data && !loading && rows.length === 0 && (
        <div className="bg-card rounded-3xl p-16 text-center border border-border flex flex-col items-center gap-3 shadow-sm mb-8">
          <div className="text-5xl mb-2">📭</div>
          <div className="text-lg font-black text-foreground">제출된 성적이 없습니다</div>
          <p className="text-sm text-muted-foreground">학생들이 시험을 제출하면 이곳에 성적이 표시됩니다.</p>
        </div>
      )}

      {/* 1. Question Stats Section */}
      {data && !loading && data.questionStats?.length > 0 && (
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 px-1 gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">문항별 상세분석</h2>
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground mt-1.5 bg-secondary/50 inline-block px-2.5 py-1 rounded-lg">
                🔴 50% 미만 (위험) &nbsp;|&nbsp; 🟡 50~79% (주의) &nbsp;|&nbsp; 🟢 80% 이상 (안전)
              </p>
            </div>
          </div>
          <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border p-4 sm:p-5">
            <QuestionStatsSection
              stats={data.questionStats}
              colorHex={subjectColor}
            />
          </div>
        </div>
      )}

      {/* 2. Results List Section */}
      {data && !loading && rows.length > 0 && (
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4 px-1">
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">학생별 성적표</h2>
          </div>
          {/* MOBILE RESULT CARDS (< 768px) */}
          <div className="md:hidden flex flex-col gap-3">
            {rows.map((row) => {
              const isSelected = selectedStudentId === row.studentId;

              return (
                <div
                  key={row.studentId}
                  onClick={() => handleStudentClick(row.studentId, row.studentName)}
                  className="bg-card rounded-3xl p-5 border shadow-sm flex flex-col gap-4 cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: isSelected ? subjectColor : "var(--border)",
                    background: isSelected ? `${subjectColor}06` : "var(--card)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-2xl bg-secondary/70 text-secondary-foreground flex items-center justify-center text-sm font-black shrink-0 shadow-sm border border-border/50">
                      {row.rank}위
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-black text-foreground truncate">{row.studentName}</span>
                        <span className="bg-secondary/70 text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border border-border/30">
                          {row.grade}학년 {row.classNum}반
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-muted-foreground/70 tracking-wider font-mono">{row.studentId}</div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black leading-none" style={{ color: subjectColor }}>
                        {row.totalScore}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-1 tracking-wider uppercase">/ {row.maxScore} pts</div>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="bg-secondary/40 rounded-2xl p-3 border border-border/30">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                      <span className="flex items-center gap-2">
                        <span className="text-teal-600">O: {row.correctCount}</span>
                        <span className="text-red-400">X: {row.wrongCount}</span>
                        <span className="text-muted-foreground/60">-: {row.unansweredCount}</span>
                      </span>
                      <span style={{ color: subjectColor }}>{row.percent}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.percent}%`, background: subjectColor }} />
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div className="text-center pt-1 border-t border-border/30 mt-1">
                    <span className="text-[11px] font-black tracking-wide" style={{ color: subjectColor }}>
                      {isSelected ? "▲ 추이 그래프 닫기" : "📉 추이 그래프 보기"}
                    </span>
                  </div>

                  {/* Mobile Chart */}
                  {isSelected && (
                    <div className="mt-2 p-4 bg-background/50 rounded-2xl border border-border/50 shadow-inner" onClick={(e) => e.stopPropagation()}>
                      <div className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: subjectColor }}>
                        <span className="text-lg">📈</span> {historyStudentName}
                      </div>
                      {historyLoading ? (
                        <div className="py-6 text-center">
                          <span className="spinner w-5 h-5 inline-block" style={{ borderTopColor: subjectColor }} />
                        </div>
                      ) : history ? (
                        <ScoreLineChart history={history} />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP RESULT TABLE (>= 768px) */}
          <div className="hidden md:block bg-card rounded-3xl overflow-hidden shadow-sm border border-border p-1">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border/60">
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors" onClick={() => handleSort("rank")}>석차 <SortIcon field="rank" /></th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors" onClick={() => handleSort("studentId")}>학번 <SortIcon field="studentId" /></th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors" onClick={() => handleSort("name")}>이름 <SortIcon field="name" /></th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left whitespace-nowrap">학년/반</th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors" onClick={() => handleSort("percent")}>총점 <SortIcon field="percent" /></th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left whitespace-nowrap">정/오/미</th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left whitespace-nowrap">정답률</th>
                    <th className="px-5 py-4 text-[13px] font-bold text-muted-foreground text-left whitespace-nowrap">제출시각</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSelected = selectedStudentId === row.studentId;
                    return (
                      <Fragment key={row.studentId}>
                        <tr
                          onClick={() => handleStudentClick(row.studentId, row.studentName)}
                          className={cn("border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40", isSelected ? "bg-muted/40" : "bg-card")}
                        >
                          <td className="px-5 py-4 text-sm font-black text-foreground">
                            {row.rank}위
                          </td>
                          <td className="px-5 py-4 text-[13px] font-bold text-muted-foreground/80 font-mono tracking-wider">
                            {row.studentId}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-foreground">{row.studentName}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-secondary/70 text-secondary-foreground text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap border border-border/30">
                              {row.grade}학년 {row.classNum}반
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-lg font-black mr-1" style={{ color: subjectColor }}>{row.totalScore}</span>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">/ {row.maxScore}</span>
                          </td>
                          <td className="px-5 py-4 text-[13px] font-black tracking-wide">
                            <span className="text-teal-500">{row.correctCount}</span>
                            <span className="text-muted-foreground/30 mx-1.5">/</span>
                            <span className="text-red-400">{row.wrongCount}</span>
                            <span className="text-muted-foreground/30 mx-1.5">/</span>
                            <span className="text-muted-foreground/60">{row.unansweredCount}</span>
                          </td>
                          <td className="px-5 py-4 min-w-[140px]">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.percent}%`, background: subjectColor }} />
                              </div>
                              <span className="text-[13px] font-black text-foreground min-w-[36px]">{row.percent}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[11px] font-bold text-muted-foreground whitespace-nowrap uppercase tracking-wider">
                            {new Date(row.submittedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                        {isSelected && (
                          <tr key={`chart-${row.studentId}`}>
                            <td colSpan={8} className="p-0 border-b border-border/40" style={{ background: `${subjectColor}05` }}>
                              <div className="p-8">
                                <div className="text-sm font-black mb-5 flex items-center gap-2" style={{ color: subjectColor }}>
                                  <span className="text-xl">📈</span> {historyStudentName} 님의 성적 추이
                                </div>
                                {historyLoading ? (
                                  <div className="py-10 text-center">
                                    <span className="spinner w-6 h-6 inline-block" style={{ borderTopColor: subjectColor }} />
                                  </div>
                                ) : history ? (
                                  <div className="bg-background rounded-3xl p-6 border border-border/50 shadow-sm max-w-3xl mx-auto">
                                    <ScoreLineChart history={history} />
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
