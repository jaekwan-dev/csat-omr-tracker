"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
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
const SUBJECT_EMOJI: Record<string, string> = { KOREAN: "📚", MATH: "✏️", ENGLISH: "💡" };
const SUBJECT_COLOR_HEX: Record<string, string> = { KOREAN: "#7c3aed", MATH: "#f97316", ENGLISH: "#3b82f6" };

/* ── Question Stats Section ──────────────────────────────────────────── */
function QuestionStatsSection({ stats, colorHex }: { stats: QuestionStat[]; colorHex: string }) {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? stats : stats.slice(0, 15);

  return (
    <div className="flex flex-col gap-4">
      {/* Legend / Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-foreground">💡 빠른 필터: </span>
        {[
          { label: "전체", color: "bg-secondary text-secondary-foreground" },
          { label: "오답률 50%↑ (위험)", color: "bg-red-50 text-red-600 border border-red-200" },
          { label: "오답률 20~50% (주의)", color: "bg-amber-50 text-amber-600 border border-amber-200" },
        ].map((f) => (
          <button key={f.label} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", f.color)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: colorHex }}>
              {["번호", "정답", "배점", "정답률", "오답"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold text-white text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((q) => {
              const isHard = q.correctRate < 50;
              const isMedium = q.correctRate >= 50 && q.correctRate < 80;
              const rowBg = isHard ? "bg-red-50/50" : isMedium ? "bg-amber-50/50" : "bg-card";
              const barColor = isHard ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-teal-500";
              const textBarColor = isHard ? "text-red-500" : isMedium ? "text-amber-500" : "text-teal-500";
              return (
                <tr key={q.questionNum} className={cn("border-b border-border last:border-0", rowBg)}>
                  <td className={cn("px-4 py-3 font-bold text-sm", isHard ? "text-red-600" : "text-foreground")}>
                    {q.questionNum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex w-7 h-7 rounded-full items-center justify-center font-bold text-xs"
                      style={{ background: `${colorHex}22`, color: colorHex }}
                    >
                      {q.correctAnswer}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{q.score}점</td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${q.correctRate}%` }} />
                      </div>
                      <span className={cn("text-xs font-bold min-w-[32px] text-right", textBarColor)}>{q.correctRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-bold text-red-500">{q.wrongCount}명</span>
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
          className="self-center px-5 py-2.5 rounded-full text-xs font-bold bg-background border transition-all hover:bg-accent"
          style={{ borderColor: `${colorHex}44`, color: colorHex }}
        >
          {showAll ? "▲ 접기" : `▼ 전체 ${stats.length}문항 보기`}
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
      <div className="p-5 text-center text-muted-foreground text-sm">
        최소 2개 이상의 시험 제출 이력이 있어야 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 480, H = 180;
  const pad = { top: 16, right: 16, bottom: 40, left: 36 };
  const inner = { w: W - pad.left - pad.right, h: H - pad.top - pad.bottom };

  const subjects = ["KOREAN", "MATH", "ENGLISH"] as const;
  const bySubject: Record<string, HistoryItem[]> = { KOREAN: [], MATH: [], ENGLISH: [] };
  safeHistory.forEach((h) => { if (bySubject[h.subject]) bySubject[h.subject].push(h); });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[0, 50, 100].map((v) => {
        const y = pad.top + inner.h - (v / 100) * inner.h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + inner.w} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.left - 6} y={y + 4} fontSize={9} textAnchor="end" fill="var(--muted-foreground)">{v}%</text>
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

        return (
          <g key={subj}>
            <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={4} fill={color} />
                <text x={p.x} y={p.y - 8} fontSize={9} textAnchor="middle" fill={color} fontWeight="800">
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
    if (!data) return { counts: {}, total: 0 };
    const counts: Record<number, number> = {};
    data.results.forEach((r) => {
      counts[r.classNum] = (counts[r.classNum] || 0) + 1;
    });
    return { counts, total: data.results.length };
  }, [data]);

  const classNumbers = Object.keys(classStats.counts).map(Number).sort((a, b) => a - b);

  const rows = useMemo(() => {
    if (!data) return [];
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
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">성적 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">시험별 성적 통계와 학생별 점수를 확인하세요.</p>
      </div>

      {/* Smart Filter Card */}
      <div className="bg-card rounded-3xl p-5 border border-border shadow-sm mb-6 flex flex-col gap-5">
        
        {/* 1. Subject Filters */}
        <div className="flex flex-col gap-2.5">
          <div className="text-sm font-bold text-foreground">1단계: 과목 선택</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "KOREAN", label: "국어", emoji: "📚" },
              { id: "MATH", label: "수학", emoji: "✏️" },
              { id: "ENGLISH", label: "영어", emoji: "💡" },
            ].map((tab) => {
              const isActive = selectedSubjectFilter === tab.id;
              const activeColor = SUBJECT_COLOR_HEX[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubjectFilter(tab.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl transition-all border",
                    isActive
                      ? "text-white shadow-sm border-transparent"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  )}
                  style={isActive ? { background: activeColor } : undefined}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span className="text-sm font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Exam List */}
        <div className="flex flex-col gap-2.5">
          <div className="text-sm font-bold text-foreground flex items-center justify-between">
            <span>2단계: 시험 선택</span>
            <span className="text-xs font-medium text-muted-foreground">최근 등록순</span>
          </div>
          {filteredExams.length === 0 ? (
            <div className="bg-secondary/50 rounded-xl p-4 text-center text-sm text-muted-foreground border border-border">
              등록된 {SUBJECT_LABEL[selectedSubjectFilter]} 시험이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredExams.map((e) => {
                const isActive = selectedExamId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExamId(e.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex flex-col gap-2",
                      isActive
                        ? "shadow-md bg-card"
                        : "bg-secondary/30 border-border hover:bg-secondary/80"
                    )}
                    style={isActive ? { borderColor: subjectColor } : undefined}
                  >
                    <div
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md self-start"
                      style={{ background: isActive ? `${subjectColor}15` : "var(--secondary)", color: isActive ? subjectColor : "var(--muted-foreground)" }}
                    >
                      {SUBJECT_LABEL[e.subject]}
                    </div>
                    <div className={cn("text-sm font-bold truncate w-full", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {e.title}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Class Filter */}
        {data && classNumbers.length > 0 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border flex-wrap">
            <span className="text-sm font-bold text-foreground">3단계: 반 필터</span>
            <select
              value={filterClass === null ? "ALL" : filterClass}
              onChange={(e) => setFilterClass(e.target.value === "ALL" ? null : Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-bold text-foreground outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-ring/30 transition-all"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: subjectColor }}>
          {[
            { label: "선택 시험", value: `${data.exam.title}` },
            { label: "총 응시자", value: `${rows.length}명` },
            { label: "평균 점수", value: `${data.avgScore}점`, isAccent: true },
            { label: "최고 점수", value: `${rows[0]?.totalScore ?? 0}점` },
          ].map((k) => (
            <div key={k.label} className="flex flex-col gap-1">
              <div className="text-xs font-bold text-muted-foreground">{k.label}</div>
              <div className={cn("text-lg font-black leading-tight", k.isAccent ? "" : "text-foreground")} style={k.isAccent ? { color: subjectColor } : undefined}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading / Empty States */}
      {loading && (
        <div className="bg-card rounded-2xl p-12 text-center border border-border flex flex-col items-center gap-2 shadow-sm">
          <div className="spinner mb-2" style={{ borderTopColor: subjectColor }} />
          <div className="text-sm text-muted-foreground">성적 데이터를 불러오는 중...</div>
        </div>
      )}

      {data && !loading && rows.length === 0 && (
        <div className="bg-card rounded-2xl p-12 text-center border border-border flex flex-col items-center gap-2 shadow-sm">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-base font-bold text-foreground">해당 반에 제출된 성적이 없습니다</div>
        </div>
      )}

      {/* 1. Question Stats Section */}
      {data && !loading && data.questionStats?.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <span className="text-xl">📉</span>
            <div>
              <div className="text-base font-bold text-foreground">문항별 정답률 통계</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                🔴 50% 미만 &nbsp;|&nbsp; 🟡 50~79% &nbsp;|&nbsp; 🟢 80% 이상
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <QuestionStatsSection
              stats={data.questionStats}
              colorHex={subjectColor}
            />
          </div>
        </div>
      )}

      {/* 2. Results List Section */}
      {data && !loading && rows.length > 0 && (
        <>
          {/* MOBILE RESULT CARDS (< 768px) */}
          <div className="md:hidden flex flex-col gap-3">
            {rows.map((row) => {
              const isSelected = selectedStudentId === row.studentId;

              return (
                <div
                  key={row.studentId}
                  onClick={() => handleStudentClick(row.studentId, row.studentName)}
                  className="bg-card rounded-2xl p-4 border shadow-sm flex flex-col gap-3 cursor-pointer transition-colors"
                  style={{
                    borderColor: isSelected ? subjectColor : "var(--border)",
                    background: isSelected ? `${subjectColor}06` : "var(--card)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {row.rank}위
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">{row.studentName}</span>
                        <span className="bg-secondary text-secondary-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                          {row.grade}학년 {row.classNum}반
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">학번: {row.studentId}</div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xl font-black leading-none" style={{ color: subjectColor }}>
                        {row.totalScore}점
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">/ {row.maxScore}점</div>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="bg-secondary/50 rounded-xl p-2.5">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
                      <span>
                        <span className="text-teal-600">정답 {row.correctCount}</span> · <span className="text-red-500">오답 {row.wrongCount}</span> · <span>미응답 {row.unansweredCount}</span>
                      </span>
                      <span style={{ color: subjectColor }}>{row.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${row.percent}%`, background: subjectColor }} />
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div className="text-center pt-1">
                    <span className="text-[11px] font-bold" style={{ color: subjectColor }}>
                      {isSelected ? "▲ 성적 추이 그래프 접기" : "📈 성적 추이 그래프 보기 (터치)"}
                    </span>
                  </div>

                  {/* Mobile Chart */}
                  {isSelected && (
                    <div className="mt-2 p-3 bg-card rounded-xl border border-border" onClick={(e) => e.stopPropagation()}>
                      <div className="text-sm font-bold mb-2" style={{ color: subjectColor }}>
                        📈 {historyStudentName} 님의 성적 변화 추이
                      </div>
                      {historyLoading ? (
                        <div className="p-5 text-center">
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
          <div className="hidden md:block bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left cursor-pointer border-b border-border select-none whitespace-nowrap hover:bg-accent" onClick={() => handleSort("rank")}>석차 <SortIcon field="rank" /></th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left cursor-pointer border-b border-border select-none whitespace-nowrap hover:bg-accent" onClick={() => handleSort("studentId")}>학번 <SortIcon field="studentId" /></th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left cursor-pointer border-b border-border select-none whitespace-nowrap hover:bg-accent" onClick={() => handleSort("name")}>이름 <SortIcon field="name" /></th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left border-b border-border whitespace-nowrap">학년/반</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left cursor-pointer border-b border-border select-none whitespace-nowrap hover:bg-accent" onClick={() => handleSort("percent")}>총점 <SortIcon field="percent" /></th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left border-b border-border whitespace-nowrap">정답/오답/미응답</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left border-b border-border whitespace-nowrap">정답률</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground text-left border-b border-border whitespace-nowrap">제출시각</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSelected = selectedStudentId === row.studentId;
                    return (
                      <Fragment key={row.studentId}>
                        <tr
                          onClick={() => handleStudentClick(row.studentId, row.studentName)}
                          className={cn("border-b border-border cursor-pointer transition-colors hover:bg-muted/50", isSelected ? "bg-muted/50" : "bg-card")}
                        >
                          <td className="px-4 py-3 text-sm font-bold text-foreground">
                            {row.rank}위
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground font-medium">
                            {row.studentId}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-foreground">{row.studentName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-secondary text-secondary-foreground text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
                              {row.grade}학년 {row.classNum}반
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-base font-black mr-1" style={{ color: subjectColor }}>{row.totalScore}</span>
                            <span className="text-xs text-muted-foreground">/ {row.maxScore}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="font-bold text-teal-600">{row.correctCount}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="font-bold text-red-500">{row.wrongCount}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-muted-foreground">{row.unansweredCount}</span>
                          </td>
                          <td className="px-4 py-3 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${row.percent}%`, background: subjectColor }} />
                              </div>
                              <span className="text-xs font-bold text-foreground min-w-[32px]">{row.percent}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(row.submittedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                        {isSelected && (
                          <tr key={`chart-${row.studentId}`}>
                            <td colSpan={8} className="p-0 border-b border-border" style={{ background: `${subjectColor}08` }}>
                              <div className="p-5">
                                <div className="text-sm font-bold mb-3" style={{ color: subjectColor }}>
                                  📈 {historyStudentName} 님의 성적 추이
                                </div>
                                {historyLoading ? (
                                  <div className="p-6 text-center">
                                    <span className="spinner w-6 h-6 inline-block" style={{ borderTopColor: subjectColor }} />
                                  </div>
                                ) : history ? (
                                  <ScoreLineChart history={history} />
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
        </>
      )}
    </div>
  );
}
