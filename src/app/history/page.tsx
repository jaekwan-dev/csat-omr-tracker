"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const SUBJECT_META: Record<string, { label: string; emoji: string; gradient: string }> = {
  KOREAN: { label: "국어", emoji: "📚", gradient: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)" },
  MATH: { label: "수학", emoji: "✏️", gradient: "linear-gradient(145deg, #f97316 0%, #7c3aed 100%)" },
  ENGLISH: { label: "영어", emoji: "💡", gradient: "linear-gradient(145deg, #06b6d4 0%, #3b82f6 100%)" },
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

  return (
    <div style={styles.page}>
      <div style={styles.bgDeco} />
      
      <header style={styles.header}>
        <div className="container" style={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-0.02em" }}>학습 이력</span>
          </div>
        </div>
      </header>

      <main className="container" style={styles.main}>
        <div className="anim-fadeInUp" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
            나의 성취도 기록
          </h1>
          <p style={{ fontSize: 14, color: "#475569" }}>
            지금까지 제출한 모의고사와 기출문제 결과입니다.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#3b82f6", borderColor: "#bfdbfe", margin: "0 auto" }} />
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>아직 완료한 시험이 없습니다</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>홈 화면에서 첫 시험을 시작해보세요!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {submissions.map((sub) => {
              const meta = SUBJECT_META[sub.subject] || { label: sub.subject, emoji: "📝", gradient: "#ccc" };
              const scorePercent = sub.maxScore > 0 ? (sub.totalScore / sub.maxScore) * 100 : 0;
              
              return (
                <Link key={sub.id} href={`/result/${sub.id}`} style={{ display: "block", textDecoration: "none" }}>
                  <div style={styles.historyCard}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ ...styles.cardEmojiBox, background: meta.gradient }}>
                        <span style={{ fontSize: 24 }}>{meta.emoji}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                          {meta.label} • {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                          {sub.title}
                        </div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>
                          총 {sub.totalQuestions}문항
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: scorePercent >= 90 ? "#10b981" : "#3b82f6" }}>
                          {sub.totalScore}
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>/{sub.maxScore}</span>
                        </div>
                        <span style={{ fontSize: 20, color: "#cbd5e1", marginTop: 4 }}>›</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
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
  historyCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
    transition: "transform 0.2s, boxShadow 0.2s",
  },
  cardEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
};
