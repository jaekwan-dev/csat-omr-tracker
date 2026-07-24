"use client";

import { useState, useEffect, useMemo, Fragment } from "react";

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
const SUBJECT_EMOJI: Record<string, string> = { KOREAN: "📚", MATH: "✏️", ENGLISH: "💡" };
const SUBJECT_COLOR: Record<string, string> = {
  KOREAN: "#764ba2", MATH: "#7c3aed", ENGLISH: "#3b82f6",
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

  const avgCorrectRate = Math.round(stats.reduce((s, q) => s + q.correctRate, 0) / stats.length);
  const hardest = [...stats].sort((a, b) => a.correctRate - b.correctRate)[0];
  const easiest = [...stats].sort((a, b) => b.correctRate - a.correctRate)[0];
  const perfectCount = stats.filter(q => q.correctRate === 100).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 요약 카드리스트 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "평균 정답률", value: `${avgCorrectRate}%`, sub: `전체 ${stats.length}문항`, icon: "📊", bg: "#f0f9ff", vc: color },
          { label: "최다 오답 문항", value: `${hardest.questionNum}번`, sub: `정답률 ${hardest.correctRate}%`, icon: "🔴", bg: "#fff5f5", vc: "#dc2626" },
          { label: "최고 정답 문항", value: `${easiest.questionNum}번`, sub: `정답률 ${easiest.correctRate}%`, icon: "🟢", bg: "#f0fdf4", vc: "#059669" },
          { label: "전원 정답 문항", value: `${perfectCount}개`, sub: perfectCount > 0 ? `100% 정답` : "없음", icon: "✅", bg: "#fefce8", vc: "#d97706" },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c.vc, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 정렬 토글 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>정렬:</span>
        {(["wrongRate", "questionNum"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
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

      {/* 문항별 정답률 목록 */}
      <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #e2e8f0" }}>
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
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: isHard ? "#dc2626" : "#374151", fontSize: 14 }}>
                    {q.questionNum}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-flex", width: 26, height: 26, borderRadius: "50%",
                      alignItems: "center", justifyContent: "center",
                      background: color + "22", color, fontWeight: 800, fontSize: 12,
                    }}>{q.correctAnswer}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>{q.score}점</td>
                  <td style={{ padding: "10px 12px", minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${q.correctRate}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: barColor, minWidth: 32, textAlign: "right" }}>{q.correctRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: "#ef4444" }}>{q.wrongCount}명</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>{q.unansweredCount}명</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stats.length > 15 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{ alignSelf: "center", padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${color}44`, background: "#fff", color, fontFamily: "inherit" }}
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
      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        최소 2개 이상의 시험 제출 이력이 있어야 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 480, H = 180;
  const pad = { top: 16, right: 16, bottom: 40, left: 36 };
  const inner = { w: W - pad.left - pad.right, h: H - pad.top - pad.bottom };

  const subjects = ["KOREAN", "MATH", "ENGLISH"] as const;
  const bySubject: Record<string, HistoryItem[]> = { KOREAN: [], MATH: [], ENGLISH: [] };
  history.forEach((h) => { if (bySubject[h.subject]) bySubject[h.subject].push(h); });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[0, 50, 100].map((v) => {
        const y = pad.top + inner.h - (v / 100) * inner.h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + inner.w} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 6} y={y + 4} fontSize={9} textAnchor="end" fill="#94a3b8">{v}%</text>
          </g>
        );
      })}

      {subjects.map((subj) => {
        const items = bySubject[subj];
        if (items.length < 1) return null;
        const color = SUBJECT_COLOR[subj];

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

  // Auto-select first exam when subject filter changes
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

  // Fetch exam data
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

  // Fetch student history
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

  const classStats = useMemo(() => {
    if (!data) return { counts: {} as Record<number, number>, total: 0 };
    const counts: Record<number, number> = {};
    data.submissions.forEach((s) => {
      counts[s.classNum] = (counts[s.classNum] || 0) + 1;
    });
    return { counts, total: data.submissions.length };
  }, [data]);

  const classNumbers = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.submissions.map((s) => s.classNum))].sort((a, b) => a - b);
  }, [data]);

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
    <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
      {/* Header Block */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>성적 대시보드</h1>
          <p style={styles.pageSubtitle}>과목과 시험을 선택하여 반별 성적과 오답률을 조회하세요.</p>
        </div>
      </div>

      {/* Grid Control Center */}
      <div style={styles.smartFilterCard}>
        {/* 과목 선택 그리드 (3열 균등 그리드: 국어 / 수학 / 영어) */}
        <div style={styles.filterSection}>
          <div style={styles.filterSectionLabel}>
            <span>과목 선택</span>
          </div>
          <div style={styles.subjectSegmentGrid}>
            {[
              { id: "KOREAN", label: "국어", emoji: "📚" },
              { id: "MATH", label: "수학", emoji: "✏️" },
              { id: "ENGLISH", label: "영어", emoji: "💡" },
            ].map((tab) => {
              const isActive = selectedSubjectFilter === tab.id;
              const activeColor = SUBJECT_COLOR[tab.id] || "#0f766e";
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubjectFilter(tab.id)}
                  style={{
                    ...styles.subjectGridBtn,
                    background: isActive ? activeColor : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: isActive ? 900 : 700,
                    border: isActive ? `1.5px solid ${activeColor}` : "1.5px solid #cbd5e1",
                    boxShadow: isActive ? `0 4px 12px ${activeColor}33` : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{tab.emoji}</span>
                  <span style={{ fontSize: 14 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 시험 회차 선택 그리드 */}
        <div style={styles.filterSection}>
          <div style={styles.filterSectionLabel}>
            <span>시험 회차 선택</span>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              ({SUBJECT_LABEL[selectedSubjectFilter]} 시험 {filteredExams.length}개)
            </span>
          </div>
          <div style={styles.examCardGrid}>
            {filteredExams.map((exam) => {
              const isSelected = selectedExamId === exam.id;
              const color = SUBJECT_COLOR[exam.subject] || "#0f766e";
              const emoji = SUBJECT_EMOJI[exam.subject] || "📝";

              return (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  style={{
                    ...styles.examGridCard,
                    borderColor: isSelected ? color : "#cbd5e1",
                    background: isSelected ? `${color}10` : "#ffffff",
                    boxShadow: isSelected ? `0 4px 14px ${color}25` : "0 2px 6px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ ...styles.subjectTagChip, color, background: `${color}18` }}>{emoji} {SUBJECT_LABEL[exam.subject]}</span>
                    {isSelected && <span style={{ fontSize: 11, color, fontWeight: 900 }}>✓ 선택됨</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>
                    {exam.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                    총 {exam.totalQuestions}문항
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 학반 선택 (리스트 드롭다운 형식 - 반이 10개 이상일 때도 완벽 최적화) */}
        {data && !loading && (
          <div style={styles.classSelectRow}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>반 선택</span>
            </div>

            <select
              value={filterClass ?? "ALL"}
              onChange={(e) => {
                const val = e.target.value;
                setFilterClass(val === "ALL" ? null : Number(val));
              }}
              style={{
                ...styles.classDropdownSelect,
                borderColor: subjectColor,
              }}
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

      {/* KPI Metric Summary Strip */}
      {data && !loading && (
        <div style={{ ...styles.kpiGrid, borderLeft: `4px solid ${subjectColor}` }}>
          {[
            { label: "선택 시험", value: `${SUBJECT_LABEL[data.exam.subject]} ${data.exam.title}` },
            { label: "총 응시자", value: `${rows.length}명` },
            { label: "평균 점수", value: `${data.avgScore}점`, isAccent: true },
            { label: "최고 점수", value: `${rows[0]?.totalScore ?? 0}점` },
          ].map((k) => (
            <div key={k.label} style={styles.kpiCell}>
              <div style={styles.kpiLabel}>{k.label}</div>
              <div style={{ ...styles.kpiValue, color: k.isAccent ? subjectColor : "#0f172a" }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading / Empty States */}
      {loading && (
        <div style={styles.emptyBox}>
          <div className="spinner" style={{ width: 36, height: 36, borderTopColor: subjectColor, borderColor: "#e2e8f0", margin: "0 auto" }} />
          <div style={styles.emptyDesc}>성적 데이터를 불러오는 중...</div>
        </div>
      )}

      {data && !loading && rows.length === 0 && (
        <div style={styles.emptyBox}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>해당 반에 제출된 성적이 없습니다</div>
        </div>
      )}

      {/* 1. 문항별 정답률 통계 SECTION (학생별 성적표보다 상단 배치) */}
      {data && !loading && data.questionStats?.length > 0 && (
        <div style={{ ...styles.tableCard, marginBottom: 24 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📉</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>문항별 정답률 통계</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                🔴 50% 미만 &nbsp;|&nbsp; 🟡 50~79% &nbsp;|&nbsp; 🟢 80% 이상
              </div>
            </div>
          </div>
          <div style={{ padding: "16px" }}>
            <QuestionStatsSection
              stats={data.questionStats}
              color={subjectColor}
              gradient={subjectGradient}
            />
          </div>
        </div>
      )}

      {/* 2. 학생별 성적 리스트 SECTION */}
      {data && !loading && rows.length > 0 && (
        <>
          {/* MOBILE RESULT CARDS (< 768px) */}
          <div className="mobile-dashboard-results" style={styles.mobileResultList}>
            {rows.map((row) => {
              const isSelected = selectedStudentId === row.studentId;
              const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : null;

              return (
                <div
                  key={row.studentId}
                  onClick={() => handleStudentClick(row.studentId, row.studentName)}
                  style={{
                    ...styles.resultCard,
                    borderColor: isSelected ? subjectColor : "#e2e8f0",
                    background: isSelected ? `${subjectColor}06` : "#ffffff",
                  }}
                >
                  <div style={styles.resultCardHeader}>
                    {/* Rank */}
                    <div style={{ ...styles.rankCircle, background: row.rank === 1 ? "#fef9c3" : "#f1f5f9", color: row.rank === 1 ? "#d97706" : "#334155" }}>
                      {medal || `${row.rank}위`}
                    </div>

                    {/* Student Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={styles.resultStudentName}>{row.studentName}</span>
                        <span style={styles.resultClassChip}>{row.grade}학년 {row.classNum}반</span>
                      </div>
                      <div style={styles.resultStudentId}>학번: {row.studentId}</div>
                    </div>

                    {/* Total Score */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: subjectColor, lineHeight: 1 }}>
                        {row.totalScore}점
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>/ {row.maxScore}점</div>
                    </div>
                  </div>

                  {/* Accuracy Bar & Question Stats */}
                  <div style={styles.resultCardBody}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                      <span>
                        <span style={{ color: "#10b981" }}>정답 {row.correctCount}</span> · <span style={{ color: "#ef4444" }}>오답 {row.wrongCount}</span> · <span style={{ color: "#94a3b8" }}>미응답 {row.unansweredCount}</span>
                      </span>
                      <span style={{ color: subjectColor }}>{row.percent}%</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${row.percent}%`, background: subjectGradient, borderRadius: 999 }} />
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div style={styles.expandRow}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: subjectColor }}>
                      {isSelected ? "▲ 성적 추이 그래프 접기" : "📈 성적 추이 그래프 보기 (터치)"}
                    </span>
                  </div>

                  {/* Inline Expanded Student History Chart */}
                  {isSelected && (
                    <div style={styles.mobileChartContainer} onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: subjectColor, marginBottom: 8 }}>
                        📈 {historyStudentName} 님의 성적 변화 추이
                      </div>
                      {historyLoading ? (
                        <div style={{ padding: 20, textAlign: "center" }}>
                          <span className="spinner" style={{ width: 20, height: 20, borderTopColor: subjectColor, borderColor: "#e2e8f0" }} />
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
          <div className="desktop-dashboard-results" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("rank")}>석차 <SortIcon field="rank" /></th>
                  <th style={styles.th} onClick={() => handleSort("studentId")}>학번 <SortIcon field="studentId" /></th>
                  <th style={styles.th} onClick={() => handleSort("name")}>이름 <SortIcon field="name" /></th>
                  <th style={styles.th}>학년/반</th>
                  <th style={styles.th} onClick={() => handleSort("percent")}>총점 <SortIcon field="percent" /></th>
                  <th style={styles.th}>정답/오답/미응답</th>
                  <th style={styles.th}>정답률</th>
                  <th style={styles.th}>제출시각</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelected = selectedStudentId === row.studentId;
                  return (
                    <Fragment key={row.studentId}>
                      <tr
                        onClick={() => handleStudentClick(row.studentId, row.studentName)}
                        style={{
                          ...styles.tr,
                          background: isSelected ? `${subjectColor}12` : row.rank === 1 ? "#fffbeb" : "#fff",
                          borderLeft: isSelected ? `3px solid ${subjectColor}` : "3px solid transparent",
                        }}
                      >
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
                        <td style={styles.td}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: subjectColor }}>{row.totalScore}</span>
                          <span style={{ color: "#94a3b8", fontSize: 12 }}> / {row.maxScore}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>{row.correctCount}</span>
                          <span style={{ color: "#94a3b8" }}> / </span>
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>{row.wrongCount}</span>
                          <span style={{ color: "#94a3b8" }}> / </span>
                          <span style={{ color: "#94a3b8" }}>{row.unansweredCount}</span>
                        </td>
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
                      {isSelected && (
                        <tr key={`chart-${row.studentId}`}>
                          <td colSpan={8} style={{ padding: 0, background: `${subjectColor}08` }}>
                            <div style={styles.chartPanel}>
                              <div style={styles.chartPanelHeader}>
                                <span style={{ fontWeight: 700, color: subjectColor }}>📈 {historyStudentName} 님의 성적 추이</span>
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
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },

  smartFilterCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: "20px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectSegmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  subjectGridBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 8px",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    textAlign: "center",
  },
  examCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 10,
  },
  examGridCard: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1.5px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    textAlign: "left",
  },
  subjectTagChip: {
    fontSize: 10,
    fontWeight: 900,
    padding: "2px 6px",
    borderRadius: 6,
  },
  classSelectRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 16,
    borderTop: "1px solid #f1f5f9",
    flexWrap: "wrap",
  },
  classDropdownSelect: {
    padding: "10px 16px",
    borderRadius: 14,
    border: "1.5px solid #cbd5e1",
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    minWidth: 220,
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },

  kpiGrid: {
    background: "#fff",
    borderRadius: 16,
    padding: "14px 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 12,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
  },
  kpiCell: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 700,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1.2,
  },

  emptyBox: {
    background: "#fff",
    borderRadius: 20,
    padding: "50px 20px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#94a3b8",
  },

  /* Mobile Dashboard Result List */
  mobileResultList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  resultCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "14px 16px",
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    cursor: "pointer",
  },
  resultCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
    flexShrink: 0,
  },
  resultStudentName: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },
  resultClassChip: {
    background: "#f1f5f9",
    color: "#475569",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 6,
  },
  resultStudentId: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  resultCardBody: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: "8px 12px",
  },
  expandRow: {
    textAlign: "center",
    paddingTop: 2,
  },
  mobileChartContainer: {
    marginTop: 8,
    padding: 12,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
  },

  /* Desktop Table */
  tableCard: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px",
    background: "#f8faff",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
  },
  td: {
    padding: "12px 16px",
    fontSize: 14,
    verticalAlign: "middle",
    color: "#0f172a",
  },
  chartPanel: {
    padding: "16px 20px",
    borderTop: "1px solid #f1f5f9",
  },
  chartPanelHeader: {
    fontSize: 13,
    marginBottom: 8,
  },
};
