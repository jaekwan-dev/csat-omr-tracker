import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";
import BottomNav from "@/components/BottomNav";

const SUBJECT_META = {
  KOREAN: {
    label: "국어",
    labelEn: "KOREAN",
    emoji: "📚",
    gradient: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)",
    desc: "수능 국어를 정복하는\n스마트한 학습법",
    accentColor: "#764ba2",
  },
  MATH: {
    label: "수학",
    labelEn: "MATHEMATICS",
    emoji: "✏️",
    gradient: "linear-gradient(145deg, #f97316 0%, #c026d3 60%, #7c3aed 100%)",
    desc: "기초부터 심화까지!\n수능 수학 고득점 로드맵",
    accentColor: "#c026d3",
  },
  ENGLISH: {
    label: "영어",
    labelEn: "ENGLISH",
    emoji: "💡",
    gradient: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)",
    desc: "수능 영어를 정복하는\n스마트한 학습법",
    accentColor: "#3b82f6",
  },
} as const;

type Subject = keyof typeof SUBJECT_META;

export default async function MainPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const exams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "asc" }],
    select: { id: true, subject: true, title: true, totalQuestions: true, startNum: true },
  });

  const grouped = (["ENGLISH", "MATH", "KOREAN"] as Subject[]).map((subject) => ({
    subject,
    meta: SUBJECT_META[subject],
    exams: exams.filter((e) => e.subject === subject),
  }));

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgDeco} />

      {/* Top Navigation */}
      <header style={styles.header}>
        <div className="container" style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoEmoji}>🎯</span>
            <span style={styles.logoText}>수능 OMR</span>
          </div>
          <div style={styles.userRow}>
            <div style={styles.avatar}>
              {session.name.charAt(0)}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{session.name}</span>
              <span style={styles.userMeta}>{session.grade}학년 {session.classNum}반</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container" style={styles.main}>
        {/* Hero Section */}
        <div className="anim-fadeInUp" style={styles.hero}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            수능대비 성적관리
          </div>
          <h1 style={styles.heroTitle}>
            수능대비 국어, 영어, 수학<br />
            <span style={styles.heroGradient}>성적 향상 프로젝트</span>
          </h1>
          <p style={styles.heroSub}>
            {session.name}님, 오늘도 목표를 향해 달려가세요! 💪
          </p>
        </div>

        {/* Subject Cards */}
        <div className="stagger" style={styles.cardGrid}>
          {grouped.map(({ subject, meta, exams: subjectExams }) => (
            <div key={subject} style={styles.subjectSection}>
              {subjectExams.length === 0 ? (
                <div
                  className="subject-card"
                  style={{ ...styles.subjectCard, background: meta.gradient, opacity: 0.5 }}
                >
                  <div className="subject-card-body">
                    <div style={styles.cardTopRow}>
                      <div>
                        <div style={styles.cardSubjectLabel}>{meta.label}</div>
                        <div style={styles.cardSubjectEn}>{meta.labelEn}</div>
                      </div>
                      <span style={styles.cardEmoji}>{meta.emoji}</span>
                    </div>
                  </div>
                  <div className="subject-card-footer">
                    <span className="subject-card-footer-text">등록된 시험 없음</span>
                  </div>
                </div>
              ) : (
                subjectExams.map((exam) => (
                  <Link key={exam.id} href={`/exam/${exam.id}`} style={{ display: "block" }}>
                    <div
                      className="subject-card"
                      style={{ background: meta.gradient }}
                    >
                      <div className="subject-card-body">
                        <div style={styles.cardTopRow}>
                          <div>
                            <div style={styles.cardSubjectLabel}>{meta.label}</div>
                            <div style={styles.cardSubjectEn}>{meta.labelEn}</div>
                          </div>
                          <div style={styles.cardEmojiBox}>
                            <span style={styles.cardEmoji}>{meta.emoji}</span>
                          </div>
                        </div>
                        <div style={styles.cardInfo}>
                          <span style={styles.cardChip}>{exam.title}</span>
                          <span style={styles.cardChip}>
                            {exam.startNum}~{exam.startNum + exam.totalQuestions - 1}번
                          </span>
                        </div>
                      </div>
                      <div className="subject-card-footer">
                        <span className="subject-card-footer-text" style={{ whiteSpace: "pre-line", fontSize: 13 }}>
                          {meta.desc}
                        </span>
                        <span style={styles.cardArrow}>›</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
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
    paddingTop: 32,
    paddingBottom: 100,
    display: "flex",
    flexDirection: "column",
    gap: 36,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
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
  heroGradient: {
    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: 15,
    color: "#475569",
  },
  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  subjectSection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardSubjectLabel: {
    fontSize: 36,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.03em",
    lineHeight: 1,
    marginBottom: 4,
    textShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  cardSubjectEn: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.1em",
  },
  cardEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  cardChip: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
    backdropFilter: "blur(4px)",
  },
  cardArrow: {
    fontSize: 22,
    color: "rgba(255,255,255,0.85)",
    fontWeight: 300,
  },
};
