"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import StudentHeader from "@/components/StudentHeader";

const SUBJECT_META: Record<string, { label: string; emoji: string; color: string; gradient: string }> = {
  KOREAN: { label: "국어", emoji: "📚", color: "#764ba2", gradient: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)" },
  MATH: { label: "수학", emoji: "✏️", color: "#7c3aed", gradient: "linear-gradient(145deg, #f97316 0%, #7c3aed 100%)" },
  ENGLISH: { label: "영어", emoji: "💡", color: "#3b82f6", gradient: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)" },
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

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("KOREAN");
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

  return (
    <div style={styles.page}>
      <div style={styles.bgDeco} />
      
      <StudentHeader />

      <main className="container" style={styles.main}>
        <div className="anim-fadeInUp" style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>
            제출 이력
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            제출을 완료한 시험 성적 및 채점 결과표를 조회합니다.
          </p>
        </div>

        {/* Top Subject Filter & Search Bar */}
        <div style={styles.filterControlCard}>
          {/* 과목 3열 균등 그리드 (스크롤 0%) */}
          <div style={styles.subjectFilterGrid}>
            {[
              { id: "KOREAN", label: "국어", emoji: "📚", count: submissions.filter(s => s.subject === "KOREAN").length },
              { id: "MATH", label: "수학", emoji: "✏️", count: submissions.filter(s => s.subject === "MATH").length },
              { id: "ENGLISH", label: "영어", emoji: "💡", count: submissions.filter(s => s.subject === "ENGLISH").length },
            ].map((tab) => {
              const isActive = selectedSubjectFilter === tab.id;
              const activeColor = SUBJECT_META[tab.id]?.color || "#3b82f6";
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubjectFilter(tab.id)}
                  style={{
                    ...styles.subjectGridBtn,
                    background: isActive ? activeColor : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    borderColor: isActive ? activeColor : "#cbd5e1",
                    fontWeight: isActive ? 900 : 700,
                    boxShadow: isActive ? `0 4px 12px ${activeColor}33` : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{tab.emoji}</span>
                  <span style={{ fontSize: 14 }}>{tab.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 2 }}>({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* 검색 입력창 */}
          <div style={styles.searchBox}>
            <span style={{ fontSize: 16, color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder={`${SUBJECT_META[selectedSubjectFilter]?.label} 제출 시험 검색...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading / Empty / Filtered List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#3b82f6", borderColor: "#bfdbfe", margin: "0 auto" }} />
          </div>
        ) : submissions.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>아직 제출한 시험이 없습니다</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>홈 화면에서 시험에 응시해 첫 성적표를 받아보세요!</div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>조회된 시험 결과가 없습니다</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
              {searchQuery ? "입력하신 검색어와 일치하는 시험이 없습니다." : "선택한 과목에 응시 완료한 시험이 없습니다."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSubmissions.map((sub) => {
              const meta = SUBJECT_META[sub.subject] || { label: sub.subject, emoji: "📝", gradient: "#ccc" };
              const scorePercent = sub.maxScore > 0 ? (sub.totalScore / sub.maxScore) * 100 : 0;
              
              return (
                <Link key={sub.id} href={`/result/${sub.id}`} style={{ display: "block", textDecoration: "none" }}>
                  <div style={styles.historyCard}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ ...styles.cardEmojiBox, background: meta.gradient }}>
                        <span style={{ fontSize: 24 }}>{meta.emoji}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                          {meta.label} • {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          총 {sub.totalQuestions}문항
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: scorePercent >= 90 ? "#10b981" : "#3b82f6" }}>
                          {sub.totalScore}
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>/{sub.maxScore}</span>
                        </div>
                        <span style={{ fontSize: 18, color: "#cbd5e1", marginTop: 2 }}>›</span>
                      </div>
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
    paddingTop: 24,
    paddingBottom: 100,
  },

  /* Filter Control Card */
  filterControlCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    marginBottom: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  subjectFilterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  subjectGridBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 6px",
    borderRadius: 14,
    cursor: "pointer",
    border: "1.5px solid #cbd5e1",
    transition: "all 0.15s",
    textAlign: "center",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f8fafc",
    borderRadius: 14,
    padding: "8px 14px",
    border: "1px solid #cbd5e1",
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    outline: "none",
    color: "#0f172a",
  },
  clearBtn: {
    fontSize: 13,
    color: "#94a3b8",
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  emptyCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "48px 20px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
  },

  historyCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "16px 18px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
    transition: "all 0.15s ease",
  },
  cardEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    flexShrink: 0,
  },
};
