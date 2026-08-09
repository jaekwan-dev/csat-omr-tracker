"use client";

import { useState, useEffect } from "react";

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

const SUBJECT_META: Record<string, { label: string; emoji: string; color: string; gradient: string }> = {
  KOREAN: { label: "국어", emoji: "📚", color: "#764ba2", gradient: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)" },
  MATH: { label: "수학", emoji: "✏️", color: "#7c3aed", gradient: "linear-gradient(145deg, #f97316 0%, #7c3aed 100%)" },
  ENGLISH: { label: "영어", emoji: "💡", color: "#3b82f6", gradient: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)" },
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
    <div style={styles.page}>
      <div style={styles.bgDeco} />

      <StudentHeader />

      <main className="container" style={styles.main}>
        <div className="anim-fadeInUp" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
            성적 통계
          </h1>
          <p style={{ fontSize: 14, color: "#475569" }}>
            응시한 시험의 성적 지표 및 변화 추이입니다.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#3b82f6", borderColor: "#bfdbfe", margin: "0 auto" }} />
          </div>
        ) : !hasData || chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>아직 등록된 성적 데이터가 없습니다</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>홈 화면에서 시험에 응시하면 분석 그래프가 생성됩니다!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Overview Summary Cards */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryIcon}>📝</span>
                <div style={styles.summaryValue}>{summary?.totalExams}회</div>
                <div style={styles.summaryLabel}>총 응시 시험</div>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryIcon}>🎯</span>
                <div style={styles.summaryValue}>{summary?.overallAvgScore}점</div>
                <div style={styles.summaryLabel}>평균 점수</div>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryIcon}>🏆</span>
                <div style={styles.summaryValue}>{summary?.highestScore}점</div>
                <div style={styles.summaryLabel}>최고 점수</div>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryIcon}>✨</span>
                <div style={styles.summaryValue}>{summary?.overallAccuracy}%</div>
                <div style={styles.summaryLabel}>종합 정답률</div>
              </div>
            </div>

            {/* Subject Filter Grid (스크롤 0% 3열 과목 그리드) */}
            <div style={styles.filterGrid}>
              {[
                { id: "KOREAN", label: "국어", emoji: "📚" },
                { id: "MATH", label: "수학", emoji: "✏️" },
                { id: "ENGLISH", label: "영어", emoji: "💡" },
              ].map((f) => {
                const isActive = selectedSubject === f.id;
                const activeColor = SUBJECT_META[f.id]?.color || "#3b82f6";
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedSubject(f.id)}
                    style={{
                      ...styles.filterGridBtn,
                      background: isActive ? activeColor : "#ffffff",
                      color: isActive ? "#ffffff" : "#475569",
                      borderColor: isActive ? activeColor : "#cbd5e1",
                      boxShadow: isActive ? `0 4px 12px ${activeColor}33` : "none",
                      fontWeight: isActive ? 900 : 700,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{f.emoji}</span>
                    <span style={{ fontSize: 14 }}>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Score Trend Chart Section */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                    📉 {SUBJECT_META[selectedSubject]?.label} 성적 변화 흐름
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    응시한 시험의 획득 점수 추이입니다.
                  </div>
                </div>
              </div>

              {filteredChartData.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
                  해당 과목의 응시 기록이 없습니다.
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  {/* Visualizer Container (No overflow) */}
                  <div style={{ position: "relative", height: 180, width: "100%", display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 24, borderBottom: "2px dashed #e2e8f0" }}>
                    {filteredChartData.map((item) => {
                      const meta = SUBJECT_META[item.subject] || { color: "#3b82f6", emoji: "📝", label: item.subject };
                      const heightPercent = Math.max(item.scorePercent, 10);
                      return (
                        <div key={item.id} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          {/* Score Label */}
                          <div style={{ fontSize: 11, fontWeight: 900, color: meta.color, marginBottom: 4 }}>
                            {item.score}점
                          </div>

                          {/* Bar Graphic */}
                          <div
                            style={{
                              width: "100%",
                              maxWidth: 36,
                              height: `${heightPercent}%`,
                              background: meta.color,
                              borderRadius: "8px 8px 0 0",
                              boxShadow: `0 4px 10px ${meta.color}44`,
                              transition: "height 0.4s ease",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X Axis Labels */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {filteredChartData.map((item) => (
                      <div key={item.id} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          {item.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Specific Analytics Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                🎯 과목별 성적 상세 분석
              </div>

              {Object.keys(SUBJECT_META).map((subjKey) => {
                const meta = SUBJECT_META[subjKey];
                const stat = subjectStats[subjKey];

                if (!stat) {
                  return (
                    <div key={subjKey} style={styles.subjectStatCardEmpty}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{meta.emoji}</span>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#64748b" }}>{meta.label}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>응시한 시험이 없습니다.</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={subjKey} style={styles.subjectStatCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: meta.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>
                          {meta.emoji}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>{meta.label}</div>
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>총 {stat.count}회 응시</div>
                        </div>
                      </div>


                    </div>

                    <div style={styles.statGrid}>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>평균 점수</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: meta.color }}>{stat.avgScore}점</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>최고 점수</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>{stat.highestScore}점</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>최근 점수</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>{stat.recentScore}점</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>평균 정답률</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#10b981" }}>{stat.accuracy}%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {/* <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                        <span>정답률 성취도</span>
                        <span>{stat.accuracy}%</span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${stat.accuracy}%`, background: meta.gradient, borderRadius: 999, transition: "width 0.4s ease" }} />
                      </div>
                    </div> */}
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflowX: "hidden",
  },
  bgDeco: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: 200,
    background: "linear-gradient(180deg, #e0e7ff 0%, #f8fafc 100%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(248,250,252,0.9)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(226,232,240,0.8)",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  main: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    paddingTop: 32,
    paddingBottom: 100,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 10,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "16px 10px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  summaryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    marginTop: 4,
  },

  /* 3-column zero-scroll subject filter grid */
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  filterGridBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 4px",
    borderRadius: 14,
    border: "1.5px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "center",
  },

  chartCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },
  chartTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectStatCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
  },
  subjectStatCardEmpty: {
    background: "#f8fafc",
    borderRadius: 20,
    padding: 16,
    border: "1px dashed #cbd5e1",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(65px, 1fr))",
    gap: 8,
    background: "#f8fafc",
    padding: 12,
    borderRadius: 14,
    textAlign: "center",
  },
};
