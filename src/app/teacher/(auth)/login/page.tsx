"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push("/teacher");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="login-panel-left" style={styles.leftPanel}>
        <div style={styles.leftInner}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>📋</div>
            <div>
              <div style={styles.logoTitle}>수능 OMR</div>
              <div style={styles.logoSub}>교사 관리 시스템</div>
            </div>
          </div>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              스마트한<br />
              <span style={styles.heroAccent}>성적 관리 도구</span>
            </h1>
            <p style={styles.heroDesc}>
              시험을 등록하고, 학생 성적을 한눈에 확인하세요.<br />
              반별 분석, 성적 추이, CSV 다운로드까지 제공합니다.
            </p>
          </div>
          <div style={styles.featureList}>
            {[
              { icon: "📊", text: "반별 성적 대시보드" },
              { icon: "✏️", text: "시험 등록 및 정답 관리" },
              { icon: "📈", text: "학생별 성적 추이 그래프" },
              { icon: "⬇️", text: "성적 CSV 다운로드" },
            ].map((f) => (
              <div key={f.text} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...styles.deco, width: 300, height: 300, top: -80, right: -80, opacity: 0.12 }} />
        <div style={{ ...styles.deco, width: 200, height: 200, bottom: 40, left: -60, opacity: 0.08 }} />
      </div>

      <div className="login-panel-right" style={styles.rightPanel}>
        <div className="anim-fadeInUp login-card" style={styles.formCard}>
          <div style={styles.teacherBadge}>교사 전용</div>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>교사 로그인</h2>
            <p style={styles.formSubtitle}>관리자 비밀번호를 입력하세요</p>
          </div>
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div>
              <label className="label" htmlFor="password">비밀번호</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="alert alert-error anim-fadeIn">
                <span>⚠️</span> {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !password}
              style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)", boxShadow: "0 4px 14px rgba(8,145,178,0.4)" }}
            >
              {loading ? <><span className="spinner" />로그인 중...</> : "로그인 →"}
            </button>
          </form>
          <a href="/login" style={styles.studentLink}>학생 로그인으로 돌아가기 →</a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", flexWrap: "wrap" },
  leftPanel: {
    flex: "1 1 420px", minHeight: 300,
    background: "linear-gradient(150deg, #0f766e 0%, #0891b2 50%, #1d4ed8 100%)",
    display: "flex", flexDirection: "column", justifyContent: "center",
    padding: "60px 48px", position: "relative", overflow: "hidden",
  },
  leftInner: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 40 },
  logoArea: { display: "flex", alignItems: "center", gap: 14 },
  logoIcon: {
    width: 52, height: 52, borderRadius: 16,
    background: "rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
    backdropFilter: "blur(8px)",
  },
  logoTitle: { fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" },
  logoSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 },
  heroText: { display: "flex", flexDirection: "column", gap: 16 },
  heroTitle: { fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em" },
  heroAccent: { background: "linear-gradient(90deg, #fbbf24, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  heroDesc: { fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 },
  featureList: { display: "flex", flexDirection: "column", gap: 10 },
  featureItem: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(8px)" },
  featureIcon: { fontSize: 18 },
  featureText: { color: "#fff", fontWeight: 600, fontSize: 14 },
  deco: { position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,1)", pointerEvents: "none" },
  rightPanel: { flex: "1 1 360px", background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" },
  formCard: {
    width: "100%", maxWidth: 400, background: "#fff", borderRadius: 28,
    padding: "44px 40px", boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
    display: "flex", flexDirection: "column", gap: 24,
  },
  teacherBadge: {
    display: "inline-flex", alignItems: "center",
    background: "#ccfbf1", color: "#0f766e",
    fontWeight: 800, fontSize: 12, padding: "5px 14px",
    borderRadius: 999, width: "fit-content", letterSpacing: "0.06em",
  },
  formHeader: { display: "flex", flexDirection: "column", gap: 6 },
  formTitle: { fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" },
  formSubtitle: { fontSize: 15, color: "#64748b" },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  studentLink: { fontSize: 13, color: "#0891b2", textAlign: "center", display: "block", textDecoration: "underline" },
};
