"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-6">
      <div className="w-full max-w-[400px] bg-card rounded-[28px] p-8 sm:p-9 shadow-xl border border-border flex flex-col gap-7 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col gap-1.5 text-center w-full">
          <h2 className="text-[26px] font-black text-foreground tracking-tight">로그인</h2>
          <p className="text-sm font-medium text-muted-foreground">학번, 이름, PIN 번호를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full" noValidate>
          {/* Student ID */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-foreground ml-1" htmlFor="studentId">학번</label>
            <input
              id="studentId"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all"
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
            <p className="text-xs font-medium text-muted-foreground ml-1">학년+반+번호 · 예: 1학년 1반 01번 → 1101</p>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-foreground ml-1" htmlFor="name">이름</label>
            <input
              id="name"
              ref={nameRef}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all"
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

          {/* PIN */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-foreground ml-1" htmlFor="pinCode">PIN 번호 (4자리)</label>
            <input
              id="pinCode"
              ref={pinRef}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-black tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="****"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !studentId || !name || pinCode.length < 4}
            className="w-full py-4 mt-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 로그인 중...</>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <div className="mt-1 w-full text-center">
          <Link 
            href="/teacher/login" 
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-secondary/80 text-[13px] font-bold text-primary hover:bg-secondary transition-colors"
          >
            교사용 로그인 →
          </Link>
        </div>
      </div>
    </div>
  );
}
