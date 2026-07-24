"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId.trim() || !name.trim() || !pinCode.trim()) {
      setError("학번, 이름, 그리고 4자리 PIN 번호를 모두 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId.trim(), name: name.trim(), pinCode: pinCode.trim() }),
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
      <div className="anim-fadeInUp login-card" style={styles.formCard}>
        <div style={styles.formHeader}>
          <h2 style={styles.formTitle}>로그인</h2>
          <p style={styles.formSubtitle}>학번, 이름, PIN 번호를 입력하세요</p>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.length > 0) {
                  e.preventDefault();
                  pinRef.current?.focus();
                }
              }}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label className="label" htmlFor="pinCode">PIN 번호 (4자리)</label>
            <input
              id="pinCode"
              ref={pinRef}
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="****"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
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
            disabled={loading || !studentId || !name || pinCode.length < 4}
          >
            {loading ? (
              <>
                <span className="spinner" />
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <div style={styles.footerWrap}>
          <Link href="/teacher/login" style={styles.teacherLink}>
            교사용 로그인 →
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
    background: "#f0f4ff",
    padding: "24px 16px",
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    borderRadius: 28,
    padding: "40px 36px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    border: "1px solid #e2e8f0",
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    textAlign: "center",
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
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },
  footerWrap: {
    marginTop: 8,
    display: "flex",
    justifyContent: "center",
  },
  teacherLink: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3b82f6",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: 999,
    background: "#eff6ff",
    transition: "all 0.2s",
  },
};
