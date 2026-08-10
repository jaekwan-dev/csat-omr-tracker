"use client";

import { useState } from "react";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      setErrorMsg("초기 PIN 번호(0000)는 사용할 수 없습니다. 다른 번호를 입력해주세요.");
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
    <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-[420px] rounded-[32px] p-8 sm:p-10 shadow-2xl border border-border flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
        
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_8px_20px_rgba(225,29,72,0.3)] flex items-center justify-center text-white mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2 text-center">
          초기 PIN 번호 변경
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed max-w-[280px]">
          보안을 위해 <strong>0000 이외의 새로운 4자리 PIN 번호</strong>를 설정해 주세요.
        </p>

        {errorMsg && (
          <div className="w-full mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground ml-1">새 PIN 번호 (4자리 숫자)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="예: 1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full px-4 py-3.5 rounded-2xl border border-input bg-background text-xl font-black tracking-widest text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground ml-1">새 PIN 번호 확인</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 PIN 번호 재입력"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full px-4 py-3.5 rounded-2xl border border-input bg-background text-xl font-black tracking-widest text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || newPin.length < 4 || confirmPin.length < 4}
            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-black text-white shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 변경 중...</>
            ) : (
              <>🔐 새 PIN 저장 및 시작하기</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
