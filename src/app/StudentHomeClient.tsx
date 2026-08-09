"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";


const SUBJECT_META = {
  KOREAN: {
    label: "국어",
    labelEn: "KOREAN",
    emoji: "📖",
    color: "#764ba2",
    gradient: "linear-gradient(135deg, #6366f1 0%, #764ba2 100%)",
  },
  MATH: {
    label: "수학",
    labelEn: "MATHEMATICS",
    emoji: "📐",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #ea580c 0%, #c026d3 60%, #7c3aed 100%)",
  },
  ENGLISH: {
    label: "영어",
    labelEn: "ENGLISH",
    emoji: "🔤",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)",
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

import StudentHeader from "@/components/StudentHeader";

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
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgDeco} />

      {/* Top Navigation Header */}
      <StudentHeader session={session} />

      <main className="container" style={styles.main}>
        {/* Hero Section */}
        {/* <div className="anim-fadeInUp" style={styles.hero}>
          <h1 style={styles.heroTitle}>
            응시할 시험을 선택하세요
          </h1>
        </div> */}

        {/* 상단 과목 필터바 (스크롤 0% 3열 균등 그리드 & 검색창) */}
        <div style={styles.filterControlCard}>
          {/* 과목 선택 3열 균등 그리드 */}
          <div style={styles.subjectFilterGrid}>
            {(["KOREAN", "MATH", "ENGLISH"] as Subject[]).map((subjKey) => {
              const meta = SUBJECT_META[subjKey];
              const isActive = selectedSubjectFilter === subjKey;
              const count = unsubmittedExams.filter((e) => e.subject === subjKey).length;
              return (
                <button
                  key={subjKey}
                  onClick={() => setSelectedSubjectFilter(subjKey)}
                  style={{
                    ...styles.subjectGridBtn,
                    background: isActive ? meta.color : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    borderColor: isActive ? meta.color : "#cbd5e1",
                    fontWeight: isActive ? 900 : 700,
                    boxShadow: isActive ? `0 4px 12px ${meta.color}33` : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                  <span style={{ fontSize: 14 }}>{meta.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 2 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* 검색 입력창 */}
          <div style={styles.searchBox}>
            <span style={{ fontSize: 16, color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder={`${currentMeta.label} 시험 제목 검색...`}
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

        {/* 시험 목록 카드 섹션 (응시 가능 시험 없을 시 안내 카드 표시) */}
        <div className="stagger" style={styles.cardGrid}>
          {filteredExams.length === 0 ? (
            <div style={styles.emptyNoticeCard}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>
                {searchQuery ? "검색 조건에 일치하는 시험이 없습니다" : `현재 응시할 수 있는 ${currentMeta.label} 시험이 없습니다`}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
                {searchQuery ? (
                  "다른 검색어를 입력하거나 검색어를 초기화해 주세요."
                ) : isAllCompleted ? (
                  <>
                    🎉 <strong>{currentMeta.label} 영역의 모든 시험 제출을 완료하셨습니다!</strong>
                    <br />
                    제출하신 성적 결과표와 답안지는 하단 📜 <strong>[학습 이력]</strong> 탭에서 언제든지 확인하실 수 있습니다.
                  </>
                ) : (
                  "해당 과목에 아직 등록된 미응시 시험이 없습니다. 선생님이 새 시험을 등록하면 이곳에 표시됩니다."
                )}
              </div>
              {isAllCompleted && (
                <Link
                  href="/history"
                  className="btn btn-primary"
                  style={{ marginTop: 18, padding: "8px 20px", fontSize: 13, background: currentMeta.color }}
                >
                  📜 학습 이력 바로가기
                </Link>
              )}
            </div>
          ) : (
            /* 선택된 과목의 미응시 시험 카드 목록 */
            filteredExams.map((exam) => (
              <Link key={exam.id} href={`/exam/${exam.id}`} style={{ display: "block" }}>
                <div
                  className="subject-card"
                  style={{ background: currentMeta.gradient }}
                >
                  <div className="subject-card-body" style={{ padding: "20px 24px" }}>
                    <div style={styles.cardTopRow}>
                      <div>
                        <div style={styles.cardSubjectLabel}>{currentMeta.label}</div>
                        <div style={styles.cardSubjectEn}>{currentMeta.labelEn}</div>
                      </div>
                      {/* 오른쪽 과목 시그니처 글래스모피즘 이모지 뱃지 */}
                      <div style={styles.cardEmojiBadgeGroup}>
                        <div style={styles.cardEmojiBadge}>
                          <span style={{ fontSize: 28, lineHeight: 1 }}>{currentMeta.emoji}</span>
                        </div>
                      </div>
                    </div>

                    {/* 시험명 칩 & 화살표 */}
                    <div style={styles.cardExamRow}>
                      <span style={styles.examTitleChip}>{exam.title}</span>
                      <span style={styles.cardArrow}>›</span>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f0f4ff",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflowX: "hidden",
  },
  bgDeco: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: 260,
    background: "linear-gradient(180deg, #e8eeff 0%, #f0f4ff 100%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(240,244,255,0.9)",
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
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoEmoji: { fontSize: 24 },
  logoText: {
    fontSize: 18,
    fontWeight: 900,
    color: "#1e3a8a",
    letterSpacing: "-0.02em",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 15,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1,
  },
  userMeta: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1,
  },
  main: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    paddingTop: 24,
    paddingBottom: 100,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: 12,
    padding: "5px 12px",
    borderRadius: 999,
    width: "fit-content",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3b82f6",
  },
  heroTitle: {
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.25,
    letterSpacing: "-0.03em",
  },
  heroSub: {
    fontSize: 14,
    color: "#475569",
  },

  /* Top Subject Filter Control Card */
  filterControlCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
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

  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyNoticeCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: "48px 24px",
    textAlign: "center",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectCard: {
    borderRadius: 24,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
    transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  },
  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardSubjectLabel: {
    fontSize: 34,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.03em",
    lineHeight: 1,
    marginBottom: 4,
    textShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  cardSubjectEn: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.1em",
  },
  cardEmojiBadgeGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmojiBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1.5px solid rgba(255, 255, 255, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
  },

  cardExamRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  examTitleChip: {
    background: "rgba(255,255,255,0.25)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    padding: "6px 14px",
    borderRadius: 999,
    backdropFilter: "blur(6px)",
    letterSpacing: "-0.01em",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  cardArrow: {
    fontSize: 26,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 300,
    lineHeight: 1,
  },
};
