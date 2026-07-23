"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId.trim() || !name.trim()) {
      setError("학번과 이름을 모두 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Left panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftInner}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>🎯</div>
            <div>
              <div style={styles.logoTitle}>수능 OMR</div>
              <div style={styles.logoSub}>성적 관리 시스템</div>
            </div>
          </div>

          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              수능 대비<br />
              <span style={styles.heroAccent}>스마트 성적 관리</span>
            </h1>
            <p style={styles.heroDesc}>
              OMR 답안을 입력하고 즉시 채점 결과를 확인하세요.<br />
              과목별 성취도를 한눈에 파악할 수 있습니다.
            </p>
          </div>

          <div style={styles.featureList}>
            {[
              { icon: "⚡", text: "즉시 자동 채점" },
              { icon: "📊", text: "과목별 성적 분석" },
              { icon: "📱", text: "모바일 최적화 OMR" },
            ].map((f) => (
              <div key={f.text} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div style={{ ...styles.deco, width:300, height:300, top:-80, right:-80, opacity:0.15 }} />
        <div style={{ ...styles.deco, width:200, height:200, bottom:40, left:-60, opacity:0.1 }} />
      </div>

      {/* Right panel - Login form */}
      <div style={styles.rightPanel}>
        <div className="anim-fadeInUp" style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>로그인</h2>
            <p style={styles.formSubtitle}>학번과 이름으로 시작하세요</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.field}>
              <label className="label" htmlFor="studentId">학번</label>
              <input
                id="studentId"
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="예) 1101"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && studentId.length === 4) {
                    e.preventDefault();
                    nameRef.current?.focus();
                  }
                }}
                disabled={loading}
                autoFocus
              />
              <p style={styles.hint}>학년+반+번호 · 예: 1학년 1반 01번 → 1101</p>
            </div>

            <div style={styles.field}>
              <label className="label" htmlFor="name">이름</label>
              <input
                id="name"
                ref={nameRef}
                className="input"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="alert alert-error anim-fadeIn">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading || !studentId || !name}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  로그인 중...
                </>
              ) : (
                "시작하기 →"
              )}
            </button>
          </form>

          <p style={styles.footerNote}>
            학번 또는 이름을 모르는 경우 담당 선생님께 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexWrap: "wrap",
  },
  /* Left blue panel */
  leftPanel: {
    flex: "1 1 420px",
    background: "linear-gradient(150deg, #3b82f6 0%, #1d4ed8 50%, #7c3aed 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 48px",
    position: "relative",
    overflow: "hidden",
    minHeight: 300,
  },
  leftInner: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 40,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    backdropFilter: "blur(8px)",
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 500,
  },
  heroText: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  heroTitle: {
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
    letterSpacing: "-0.03em",
  },
  heroAccent: {
    background: "linear-gradient(90deg, #fbbf24, #f97316)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.7,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 16px",
    backdropFilter: "blur(8px)",
  },
  featureIcon: { fontSize: 20 },
  featureText: { color: "#fff", fontWeight: 600, fontSize: 14 },
  deco: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,1)",
    pointerEvents: "none",
  },
  /* Right panel */
  rightPanel: {
    flex: "1 1 360px",
    background: "#f8faff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    borderRadius: 28,
    padding: "44px 40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  formSubtitle: {
    fontSize: 15,
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#94a3b8",
  },
  footerNote: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.6,
    paddingTop: 4,
  },
};
