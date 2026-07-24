"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="anim-fadeInUp login-card" style={styles.formCard}>
        <div style={styles.teacherBadge}>교사 전용</div>
        <div style={styles.formHeader}>
          <h2 style={styles.formTitle}>교사 로그인</h2>
          <p style={styles.formSubtitle}>비밀번호를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
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
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !password}
            style={{
              background: "linear-gradient(135deg, #0f766e, #0891b2)",
              boxShadow: "0 4px 14px rgba(8,145,178,0.3)",
              padding: "12px",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {loading ? <><span className="spinner" />로그인 중...</> : "로그인"}
          </button>
        </form>

        <div style={styles.footerWrap}>
          <Link href="/login" style={styles.studentLink}>
            ← 학생 로그인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0fdfa",
    padding: "24px 16px",
  },
  formCard: {
    width: "100%",
    maxWidth: 380,
    background: "#fff",
    borderRadius: 28,
    padding: "40px 36px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    border: "1px solid #ccfbf1",
    alignItems: "center",
  },
  teacherBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#ccfbf1",
    color: "#0f766e",
    fontWeight: 800,
    fontSize: 12,
    padding: "4px 12px",
    borderRadius: 999,
    letterSpacing: "0.04em",
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    textAlign: "center",
    width: "100%",
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  footerWrap: {
    marginTop: 4,
    display: "flex",
    justifyContent: "center",
  },
  studentLink: {
    fontSize: 13,
    color: "#0891b2",
    textDecoration: "none",
    fontWeight: 600,
  },
};
