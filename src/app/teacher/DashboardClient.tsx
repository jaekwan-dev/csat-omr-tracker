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

interface DashboardData {
  exam: { id: number; subject: string; title: string; maxScore: number };
  avgScore: number;
  submissions: SubmissionRow[];
}

interface HistoryItem {
  examId: number; subject: string; examTitle: string;
  totalScore: number; maxScore: number; percent: number; submittedAt: string;
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
                <circle cx={p.x} cy={p.y} r={5} fill={color} />
                <text x={p.x} y={p.y - 10} fontSize={10} textAnchor="middle" fill={color} fontWeight="700">
                  {p.item.totalScore}
                </text>
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
    <div style={{ display: "flex", gap: 16, padding: "8px 0" }}>
      {(["KOREAN", "MATH", "ENGLISH"] as const).map((s) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 3, background: SUBJECT_COLOR[s], borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: "#475569" }}>{SUBJECT_LABEL[s]}</span>
        </div>
      ))}
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
