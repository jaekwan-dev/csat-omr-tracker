"use client";

import { useState, useEffect, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────
interface Exam { id: number; subject: string; title: string; totalQuestions: number }

interface SubmissionRow {
  rank: number; studentId: string; studentName: string;
  grade: number; classNum: number;
  totalScore: number; maxScore: number;
  correctCount: number; wrongCount: number; unansweredCount: number;
  percent: number; submittedAt: string;
}

interface QuestionStat {
  questionNum: number;
  correctAnswer: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalSubmissions: number;
  correctRate: number;
  wrongRate: number;
  unansweredRate: number;
}

interface DashboardData {
  exam: { id: number; subject: string; title: string; maxScore: number };
  avgScore: number;
  submissions: SubmissionRow[];
  questionStats: QuestionStat[];
}

interface HistoryItem {
  examId: number; subject: string; examTitle: string;
  totalScore: number; maxScore: number; percent: number; submittedAt: string;
  classAvgScore?: number;
  classAvgPercent?: number;
  overallAvgScore?: number;
  overallAvgPercent?: number;
  classCount?: number;
}

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };
const SUBJECT_COLOR: Record<string, string> = {
  KOREAN: "#764ba2", MATH: "#f97316", ENGLISH: "#3b82f6",
};
const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(135deg,#667eea,#764ba2)",
  MATH: "linear-gradient(135deg,#f97316,#7c3aed)",
  ENGLISH: "linear-gradient(135deg,#06b6d4,#3b82f6)",
};

// ── Question Stats Section ────────────────────────────────
function QuestionStatsSection({ stats, color, gradient }: {
  stats: QuestionStat[];
  color: string;
  gradient: string;
}) {
  const [sortBy, setSortBy] = useState<"questionNum" | "wrongRate">("wrongRate");
  const [showAll, setShowAll] = useState(false);

  if (!stats.length || stats[0].totalSubmissions === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
        제출 데이터가 없어 통계를 표시할 수 없습니다.
      </div>
    );
  }

  const sorted = [...stats].sort((a, b) =>
    sortBy === "wrongRate" ? b.wrongRate - a.wrongRate : a.questionNum - b.questionNum
  );
  const displayed = showAll ? sorted : sorted.slice(0, 15);

  // 분석 요약
  const avgCorrectRate = Math.round(stats.reduce((s, q) => s + q.correctRate, 0) / stats.length);
  const hardest = [...stats].sort((a, b) => a.correctRate - b.correctRate)[0];
  const easiest = [...stats].sort((a, b) => b.correctRate - a.correctRate)[0];
  const perfectCount = stats.filter(q => q.correctRate === 100).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 요약 카드 3개 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
        {[
          {
            label: "평균 정답률",
            value: `${avgCorrectRate}%`,
            sub: `전체 ${stats.length}문항 평균`,
            icon: "📊",
            bg: "#f0f9ff",
            vc: color,
          },
          {
            label: "최다 오답 문항",
            value: `${hardest.questionNum}번`,
            sub: `정답률 ${hardest.correctRate}% (정답 ${hardest.correctAnswer}번)`,
            icon: "🔴",
            bg: "#fff5f5",
            vc: "#dc2626",
          },
          {
            label: "최고 정답 문항",
            value: `${easiest.questionNum}번`,
            sub: `정답률 ${easiest.correctRate}%`,
            icon: "🟢",
            bg: "#f0fdf4",
            vc: "#059669",
          },
          {
            label: "전원 정답 문항",
            value: `${perfectCount}문항`,
            sub: perfectCount > 0 ? `100% 정답률` : "없음",
            icon: "✅",
            bg: "#fefce8",
            vc: "#d97706",
          },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.vc, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* 정렬 토글 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>정렬:</span>
        {(["wrongRate", "questionNum"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              background: sortBy === s ? gradient : "#f1f5f9",
              color: sortBy === s ? "#fff" : "#475569",
              border: "none",
            }}
          >
            {s === "wrongRate" ? "오답률 높은 순" : "문항 번호 순"}
          </button>
        ))}
      </div>

      {/* 바 차트 테이블 */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: gradient }}>
              {["번호", "정답", "배점", "정답률", "오답", "미응답"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((q, i) => {
              const isHard = q.correctRate < 50;
              const isMedium = q.correctRate >= 50 && q.correctRate < 80;
              const rowBg = isHard ? "#fff5f5" : isMedium ? "#fffbeb" : "#fff";
              const barColor = isHard ? "#ef4444" : isMedium ? "#f59e0b" : "#10b981";
              return (
                <tr key={q.questionNum} style={{ borderBottom: "1px solid #f1f5f9", background: rowBg }}>
                  {/* 번호 */}
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: isHard ? "#dc2626" : "#374151", fontSize: 14 }}>
                    {q.questionNum}
                    {i === 0 && sortBy === "wrongRate" && (
                      <span style={{ marginLeft: 6, fontSize: 11, background: "#fecaca", color: "#dc2626", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>최다 오답</span>
                    )}
                  </td>
                  {/* 정답 */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-flex", width: 28, height: 28, borderRadius: "50%",
                      alignItems: "center", justifyContent: "center",
                      background: color + "22", color, fontWeight: 800, fontSize: 13,
                    }}>{q.correctAnswer}</span>
                  </td>
                  {/* 배점 */}
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 13 }}>{q.score}점</td>
                  {/* 정답률 + 바 */}
                  <td style={{ padding: "10px 12px", minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${q.correctRate}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.5s ease" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: barColor, minWidth: 36, textAlign: "right" }}>{q.correctRate}%</span>
                    </div>
                  </td>
                  {/* 오답 */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{q.wrongCount}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>명 ({q.wrongRate}%)</span>
                  </td>
                  {/* 미응답 */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>{q.unansweredCount}명</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 더 보기 */}
      {stats.length > 15 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{ alignSelf: "center", padding: "8px 20px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${color}44`, background: "#fff", color, fontFamily: "inherit" }}
        >
          {showAll ? "▲ 접기" : `▼ 전체 ${stats.length}문항 보기`}
        </button>
      )}
    </div>
  );
}

// ── Simple SVG Line Chart ──────────────────────────────────
function ScoreLineChart({ history }: { history: HistoryItem[] }) {
  if (history.length < 2) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
        최소 2개 이상의 시험 제출 이력이 있어야 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 520, H = 200;
  const pad = { top: 20, right: 20, bottom: 48, left: 44 };
  const inner = { w: W - pad.left - pad.right, h: H - pad.top - pad.bottom };

  const maxY = 100, minY = 0;

  const subjects = ["KOREAN", "MATH", "ENGLISH"] as const;
  const bySubject: Record<string, HistoryItem[]> = { KOREAN: [], MATH: [], ENGLISH: [] };
  history.forEach((h) => { if (bySubject[h.subject]) bySubject[h.subject].push(h); });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {/* Y grid lines + labels */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = pad.top + inner.h - (v / 100) * inner.h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + inner.w} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 6} y={y + 4} fontSize={10} textAnchor="end" fill="#94a3b8">{v}</text>
          </g>
        );
      })}

      {/* Subject lines */}
      {subjects.map((subj) => {
        const items = bySubject[subj];
        if (items.length < 1) return null;
        const color = SUBJECT_COLOR[subj];
        
        // 개인 점수 좌표
        const pts = items.map((item, i) => {
          const x = pad.left + (i / Math.max(items.length - 1, 1)) * inner.w;
          const y = pad.top + inner.h - (item.percent / 100) * inner.h;
          return { x, y, item };
        });
        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        // 학급 평균 점수 좌표 (점선)
        const avgPts = items.map((item, i) => {
          const x = pad.left + (i / Math.max(items.length - 1, 1)) * inner.w;
          const y = pad.top + inner.h - ((item.classAvgPercent ?? 0) / 100) * inner.h;
          return { x, y, item };
        });
        const avgPathD = avgPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        return (
          <g key={subj}>
            {/* 학급 평균선 (점선) */}
            <path d={avgPathD} fill="none" stroke={`${color}66`} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* 개인 점수선 (실선) */}
            <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            
            {/* 개인 점수 마커 */}
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill={color} />
                <text x={p.x} y={p.y - 10} fontSize={10} textAnchor="middle" fill={color} fontWeight="700">
                  {p.item.totalScore}
                </text>
                
                {/* 학급 평균 마커 (선택 사항: hover 시 툴팁으로 표시하는 것이 좋지만 여기서는 작은 텍스트로 추가 가능) */}
                <circle cx={avgPts[i].x} cy={avgPts[i].y} r={3} fill={`${color}88`} />
                
                {/* X label (first subject only) */}
                {subj === "ENGLISH" && (
                  <text x={p.x} y={H - 6} fontSize={10} textAnchor="middle" fill="#475569">
                    {p.item.examTitle}
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── Legend for chart ──────────────────────────────────────
function ChartLegend() {
  return (
    <div style={{ display: "flex", gap: 16, padding: "8px 0", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>학생 점수:</span>
        {(["KOREAN", "MATH", "ENGLISH"] as const).map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 3, background: SUBJECT_COLOR[s], borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "#475569" }}>{SUBJECT_LABEL[s]}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, borderLeft: "1px solid #e2e8f0" }}>
        <div style={{ width: 16, borderTop: "2px dashed #94a3b8" }} />
        <span style={{ fontSize: 12, color: "#64748b" }}>학급 평균 (점선)</span>
      </div>
    </div>
  );
}

// ── Main Dashboard Client ─────────────────────────────────
export default function DashboardClient({ exams }: { exams: Exam[] }) {
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

  // Fetch exam data when exam changes
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

  // Fetch student history for chart
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

  // Sort toggle
  function handleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  }

  // Classes for filter
  const classNumbers = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.submissions.map((s) => s.classNum))].sort();
  }, [data]);

  // Filtered + sorted rows
  const rows = useMemo(() => {
    if (!data) return [];
    let list = filterClass !== null ? data.submissions.filter((s) => s.classNum === filterClass) : data.submissions;
    list = [...list].sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortBy === "rank") { va = a.rank; vb = b.rank; }
      else if (sortBy === "studentId") { va = a.studentId; vb = b.studentId; }
      else if (sortBy === "name") { va = a.studentName; vb = b.studentName; }
      else if (sortBy === "percent") { va = a.totalScore; vb = b.totalScore; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, filterClass, sortBy, sortDir]);

  const subjectColor = data ? SUBJECT_COLOR[data.exam.subject] : "#0f766e";
  const subjectGradient = data ? SUBJECT_GRADIENT[data.exam.subject] : "linear-gradient(135deg,#0f766e,#0891b2)";

  function SortIcon({ field }: { field: typeof sortBy }) {
    if (sortBy !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: subjectColor }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>성적 대시보드</h1>
          <p style={styles.pageSubtitle}>시험을 선택해 학생 성적을 확인하세요.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div style={styles.controlBar}>
        {/* Exam Selector */}
        <select
          value={selectedExamId ?? ""}
          onChange={(e) => setSelectedExamId(Number(e.target.value) || null)}
          style={styles.select}
        >
          <option value="">— 시험 선택 —</option>
          {(["ENGLISH", "MATH", "KOREAN"] as const).map((subj) => {
            const group = exams.filter((e) => e.subject === subj);
            if (!group.length) return null;
            return (
              <optgroup key={subj} label={SUBJECT_LABEL[subj]}>
                {group.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} ({e.totalQuestions}문항)</option>
                ))}
              </optgroup>
            );
          })}
        </select>

        {/* Class Filter */}
        {classNumbers.length > 0 && (
          <div style={styles.filterRow}>
            {[null, ...classNumbers].map((c) => (
              <button
                key={c ?? "all"}
                onClick={() => setFilterClass(c)}
                style={{
                  ...styles.filterBtn,
                  background: filterClass === c ? subjectGradient : "#fff",
                  color: filterClass === c ? "#fff" : "#475569",
                  border: filterClass === c ? "1.5px solid transparent" : "1.5px solid #e2e8f0",
                }}
              >
                {c === null ? "전체" : `${c}반`}
              </button>
            ))}
          </div>
        )}

        {/* CSV Button */}
        {selectedExamId && (
          <a
            href={`/api/teacher/dashboard/csv?examId=${selectedExamId}`}
            download
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto", flexShrink: 0, color: subjectColor, borderColor: subjectColor + "44" }}
          >
            ⬇️ CSV 다운로드
          </a>
        )}
      </div>

      {/* Stats Bar */}
      {data && !loading && (
        <div className="anim-fadeIn" style={{ ...styles.statsBar, borderLeft: `4px solid ${subjectColor}` }}>
          {[
            { label: "과목", value: SUBJECT_LABEL[data.exam.subject] ?? data.exam.subject },
            { label: "시험", value: data.exam.title },
            { label: "응시자", value: `${rows.length}명` },
            { label: "평균 점수", value: `${data.avgScore}점` },
            { label: "만점", value: `${data.exam.maxScore}점` },
            { label: "최고점", value: `${rows[0]?.totalScore ?? "-"}점` },
          ].map((s) => (
            <div key={s.label} style={styles.statCell}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={{ ...styles.statValue, color: s.label === "평균 점수" ? subjectColor : "#0f172a" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty / Loading */}
      {!selectedExamId && (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIcon}>📊</div>
          <div style={styles.emptyTitle}>시험을 선택하세요</div>
          <div style={styles.emptyDesc}>드롭다운에서 시험을 선택하면 학생 성적이 표시됩니다.</div>
        </div>
      )}

      {loading && (
        <div style={styles.emptyBox}>
          <div className="spinner" style={{ width: 36, height: 36, borderTopColor: subjectColor, borderColor: "#e2e8f0", margin: "0 auto" }} />
          <div style={styles.emptyDesc}>불러오는 중...</div>
        </div>
      )}

      {/* Grade Table */}
      {data && !loading && rows.length === 0 && (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyTitle}>제출한 학생이 없습니다</div>
        </div>
      )}

      {data && !loading && rows.length > 0 && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort("rank")} title="석차 기준 정렬">
                  석차 <SortIcon field="rank" />
                </th>
                <th style={styles.th} onClick={() => handleSort("studentId")}>학번 <SortIcon field="studentId" /></th>
                <th style={styles.th} onClick={() => handleSort("name")}>이름 <SortIcon field="name" /></th>
                <th style={styles.th}>학년/반</th>
                <th style={styles.th} onClick={() => handleSort("percent")}>
                  총점 <SortIcon field="percent" />
                </th>
                <th style={styles.th}>정답/오답/미</th>
                <th style={styles.th}>정답률</th>
                <th style={styles.th}>제출시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedStudentId === row.studentId;
                return (
                  <>
                    <tr
                      key={row.studentId}
                      onClick={() => handleStudentClick(row.studentId, row.studentName)}
                      style={{
                        ...styles.tr,
                        background: isSelected ? `${subjectColor}12` : row.rank === 1 ? "#fffbeb" : "#fff",
                        borderLeft: isSelected ? `3px solid ${subjectColor}` : "3px solid transparent",
                      }}
                    >
                      {/* 석차 */}
                      <td style={styles.td}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 28, height: 28, borderRadius: "50%", fontSize: 13, fontWeight: 800,
                          background: row.rank === 1 ? "#fef9c3" : row.rank <= 3 ? "#f1f5f9" : "transparent",
                          color: row.rank === 1 ? "#d97706" : "#374151",
                        }}>
                          {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: "#374151" }}>{row.studentId}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{row.studentName}</td>
                      <td style={{ ...styles.td, color: "#64748b" }}>{row.grade}학년 {row.classNum}반</td>
                      {/* 점수 */}
                      <td style={styles.td}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: subjectColor }}>{row.totalScore}</span>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}> / {row.maxScore}</span>
                      </td>
                      {/* 정답/오답/미응답 */}
                      <td style={styles.td}>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>{row.correctCount}</span>
                        <span style={{ color: "#94a3b8" }}> / </span>
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>{row.wrongCount}</span>
                        <span style={{ color: "#94a3b8" }}> / </span>
                        <span style={{ color: "#94a3b8" }}>{row.unansweredCount}</span>
                      </td>
                      {/* 정답률 Bar */}
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 80 }}>
                          <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${row.percent}%`, height: "100%", background: subjectGradient, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 32 }}>{row.percent}%</span>
                        </div>
                      </td>
                      <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                        {new Date(row.submittedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                    {/* Chart Row */}
                    {isSelected && (
                      <tr key={`chart-${row.studentId}`}>
                        <td colSpan={8} style={{ padding: 0, background: `${subjectColor}08` }}>
                          <div style={styles.chartPanel}>
                            <div style={styles.chartPanelHeader}>
                              <span style={{ fontWeight: 700, color: subjectColor }}>📈 {historyStudentName} 님의 성적 추이</span>
                              <ChartLegend />
                            </div>
                            {historyLoading ? (
                              <div style={{ padding: 24, textAlign: "center" }}>
                                <span className="spinner" style={{ width: 24, height: 24, borderTopColor: subjectColor, borderColor: "#e2e8f0" }} />
                              </div>
                            ) : history ? (
                              <ScoreLineChart history={history} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 문항별 오답률 통계 */}
      {data && !loading && data.questionStats?.length > 0 && (
        <div style={styles.tableCard}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📉</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>문항별 오답률 통계</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                🟥 정답률 50% 미만 &nbsp;|&nbsp; 🟨 50~79% &nbsp;|&nbsp; 🟩 80% 이상
              </div>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <QuestionStatsSection
              stats={data.questionStats}
              color={subjectColor}
              gradient={subjectGradient}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 },
  pageTitle: { fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  controlBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  select: {
    padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0",
    background: "#fff", fontSize: 14, fontWeight: 600, color: "#0f172a",
    minWidth: 220, outline: "none", cursor: "pointer",
    fontFamily: "inherit",
  },
  filterRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  filterBtn: {
    padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
  },
  statsBar: {
    background: "#fff", borderRadius: 16, padding: "16px 24px",
    display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  statCell: { display: "flex", flexDirection: "column", gap: 4 },
  statLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" },
  statValue: { fontSize: 18, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" },
  emptyBox: {
    background: "#fff", borderRadius: 20, padding: "60px 24px",
    textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex", flexDirection: "column", gap: 12, alignItems: "center",
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#374151" },
  emptyDesc: { fontSize: 14, color: "#94a3b8" },
  tableCard: {
    background: "#fff", borderRadius: 20, overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "13px 16px", background: "#f8faff",
    fontSize: 12, fontWeight: 700, color: "#475569",
    textAlign: "left", cursor: "pointer", userSelect: "none",
    borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer", transition: "background 0.12s",
  },
  td: {
    padding: "12px 16px", fontSize: 14,
    verticalAlign: "middle", color: "#0f172a",
  },
  chartPanel: {
    padding: "20px 24px",
    borderTop: "1px solid #f1f5f9",
    display: "flex", flexDirection: "column", gap: 12,
  },
  chartPanelHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 8,
    fontSize: 14,
  },
};
