"use client";

import { useState } from "react";

interface PinResetModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function PinResetModal({ isOpen, onSuccess }: PinResetModalProps) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg("PIN 번호는 4자리 숫자로 입력해주세요.");
      return;
    }

    if (newPin === "0000") {
      setErrorMsg("초기 PIN 번호(0000)는 사용할 수 없습니다. 다른 4자리 번호를 입력해주세요.");
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg("입력하신 두 PIN 번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPin, confirmPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "PIN 번호 변경 중 오류가 발생했습니다.");
        return;
      }

      alert("🎉 PIN 번호가 성공적으로 변경되었습니다!");
      onSuccess();
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="anim-fadeInUp" style={styles.modalCard}>
        {/* Header Icon & Title */}
        <div style={styles.iconCircle}>🔒</div>
        <h2 style={styles.modalTitle}>초기 PIN 번호 변경 안내</h2>
        <p style={styles.modalDesc}>
          보안을 위해 <strong>0000 이외의 새로운 4자리 PIN 번호</strong>를 재설정해 주세요.
        </p>

        {errorMsg && (
          <div style={styles.errorBox}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>새 PIN 번호 (4자리 숫자)</label>
            <input
              type="password"
              maxLength={4}
              placeholder="예: 1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>새 PIN 번호 확인</label>
            <input
              type="password"
              maxLength={4}
              placeholder="새 PIN 번호 재입력"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "PIN 번호 변경 중..." : "🔐 새 PIN 번호 저장 및 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: 28,
    maxWidth: 440,
    width: "100%",
    padding: "36px 28px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
    textAlign: "center",
    border: "1.5px solid #cbd5e1",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: "-0.02em",
  },
  modalDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: 20,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    textAlign: "left",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
  },
  input: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1.5px solid #cbd5e1",
    fontSize: 16,
    fontWeight: 800,
    outline: "none",
    letterSpacing: "0.2em",
    textAlign: "center",
    background: "#f8fafc",
  },
  submitBtn: {
    marginTop: 8,
    padding: "14px",
    borderRadius: 16,
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
    transition: "transform 0.15s",
  },
};
