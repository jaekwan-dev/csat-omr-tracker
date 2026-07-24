import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };

const SUBJECT_GRADIENT: Record<string, string> = {
  KOREAN: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)",
  MATH: "linear-gradient(145deg, #f97316 0%, #7c3aed 100%)",
  ENGLISH: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)",
};

const SUBJECT_COLOR: Record<string, string> = {
  KOREAN: "#764ba2",
  MATH: "#7c3aed",
  ENGLISH: "#3b82f6",
};

export default async function ResultPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { submissionId } = await params;
  const subId = Number(submissionId);
  if (isNaN(subId)) redirect("/");

  const submission = await prisma.submission.findUnique({
    where: { id: subId },
    include: { exam: { include: { questions: { orderBy: { questionNum: "asc" } } } } },
  });

  if (!submission || submission.studentId !== session.studentId) redirect("/");

  const answers = submission.answers as Record<string, number>;
  const results = submission.exam.questions.map((q) => {
    const myAnswer = answers[String(q.questionNum)] ?? 0;
    const isCorrect = myAnswer === q.correctAnswer;
    return { questionNum: q.questionNum, correctAnswer: q.correctAnswer, myAnswer, isCorrect, score: q.score, earnedScore: isCorrect ? q.score : 0 };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = results.filter((r) => !r.isCorrect).length;
  const unansweredCount = results.filter((r) => r.myAnswer === 0).length;
  const maxScore = results.reduce((s, r) => s + r.score, 0);
  const scorePercent = maxScore > 0 ? Math.round((submission.totalScore / maxScore) * 100) : 0;

  const gradient = SUBJECT_GRADIENT[submission.exam.subject] ?? SUBJECT_GRADIENT.ENGLISH;
  const color = SUBJECT_COLOR[submission.exam.subject] ?? "#3b82f6";
  const subjectLabel = SUBJECT_LABEL[submission.exam.subject] ?? submission.exam.subject;

  return (
    <div style={styles.page}>
      {/* Gradient Hero Header */}
      <div style={{ ...styles.heroHeader, background: gradient }}>
        <div className="container" style={styles.heroNav}>
          <Link href="/" className="btn btn-white btn-sm">← 홈</Link>
          <span style={styles.heroNavTitle}>채점 결과</span>
          <div style={{ width: 72 }} />
        </div>

        <div className="container" style={styles.heroBody}>
          {/* Score Circle */}
          <div className="anim-bounceIn" style={styles.scoreCircle}>
            <div style={styles.scoreNum}>{submission.totalScore}</div>
            <div style={styles.scoreMax}>/ {maxScore}</div>
          </div>

          <div style={styles.heroInfo}>
            <div style={styles.heroSubject}>
              {subjectLabel} · {submission.exam.title}
            </div>
            <div style={styles.heroStudent}>
              {session.name} · {session.grade}학년 {session.classNum}반
            </div>
            <div style={styles.heroDate}>
              {new Date(submission.submittedAt).toLocaleString("ko-KR", {
                month: "numeric", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })} 제출
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={styles.statsStrip}>
          {[
            { label: "정답", value: correctCount, color: "#10b981" },
            { label: "오답", value: wrongCount, color: "#ef4444" },
            { label: "미응답", value: unansweredCount, color: "#94a3b8" },
            { label: "정답률", value: `${scorePercent}%`, color: "#fff" },
          ].map((s, i) => (
            <div key={i} style={styles.statItem}>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <main className="container" style={styles.main}>
        <div style={styles.tableCard}>
          <div style={styles.tableTitle}>📋 문항별 채점 결과</div>

          <table className="omr-table" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 52 }} />
              <col />
              <col />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ background: gradient }}>번호</th>
                <th style={{ background: gradient }}>내 답안</th>
                <th style={{ background: gradient }}>정답</th>
                <th style={{ background: gradient }}>결과</th>
                <th style={{ background: gradient }}>배점</th>
                <th style={{ background: gradient }}>획득</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={r.questionNum}
                  style={{
                    background: r.isCorrect
                      ? "#f0fdf4"
                      : r.myAnswer === 0
                      ? "#f8faff"
                      : "#fff5f5",
                    opacity: 0,
                    animation: `fadeInUp 0.25s ease ${idx * 0.018}s forwards`,
                  }}
                >
                  <td style={{ fontWeight: 700, color: "#374151" }}>{r.questionNum}</td>
                  <td>
                    {r.myAnswer === 0 ? (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>미응답</span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          width: 30, height: 30,
                          borderRadius: "50%",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13, fontWeight: 800,
                          background: r.isCorrect ? "#d1fae5" : "#fee2e2",
                          color: r.isCorrect ? "#059669" : "#dc2626",
                        }}
                      >
                        {r.myAnswer}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        width: 30, height: 30,
                        borderRadius: "50%",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13, fontWeight: 800,
                        background: "#d1fae5",
                        color: "#059669",
                      }}
                    >
                      {r.correctAnswer}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 16 }}>
                      {r.isCorrect ? "✅" : r.myAnswer === 0 ? "—" : "❌"}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: 13 }}>{r.score}점</td>
                  <td style={{ fontWeight: 800, color: r.earnedScore > 0 ? color : "#cbd5e1" }}>
                    {r.earnedScore > 0 ? `+${r.earnedScore}` : "0"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: 700, color: "#374151", fontSize: 14, padding: "14px 8px" }}>
                  최종 점수
                </td>
                <td colSpan={2} style={{ fontWeight: 900, fontSize: 20, color, padding: "14px 8px" }}>
                  {submission.totalScore}점
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Actions */}
        <div className="anim-fadeInUp" style={styles.actions}>
          <Link href="/" className="btn btn-primary">
            🏠 홈으로
          </Link>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8faff",
    display: "flex",
    flexDirection: "column",
  },
  heroHeader: {
    paddingBottom: 0,
  },
  heroNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroNavTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
  },
  heroBody: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    paddingBottom: 24,
    flexWrap: "wrap",
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "3px solid rgba(255,255,255,0.4)",
  },
  scoreNum: {
    fontSize: 32,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  scoreMax: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontVariantNumeric: "tabular-nums",
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  heroSubject: {
    fontSize: 20,
    fontWeight: 900,
    color: "#fff",
  },
  heroStudent: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 600,
  },
  heroDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  statsStrip: {
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "space-around",
    padding: "16px 20px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  main: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 60,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
    border: "1px solid #e2e8f0",
  },
  tableTitle: {
    padding: "18px 20px 14px",
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    paddingTop: 8,
  },
};
