"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-6">
      <div className="w-full max-w-[380px] bg-card rounded-[28px] p-8 sm:p-9 shadow-xl border border-border flex flex-col gap-6 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center bg-teal-50 text-teal-700 font-black text-xs px-3 py-1.5 rounded-full tracking-widest border border-teal-100">
          교사 전용
        </div>
        <div className="flex flex-col gap-1.5 text-center w-full">
          <h2 className="text-[26px] font-black text-foreground tracking-tight">교사 로그인</h2>
          <p className="text-sm font-medium text-muted-foreground">관리자 비밀번호를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full" noValidate>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-foreground ml-1" htmlFor="password">비밀번호</label>
            <input
              id="password"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all tracking-widest"
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
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 mt-1 rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner !w-4 !h-4" />로그인 중...</span> : "로그인"}
          </button>
        </form>

        <div className="mt-2 w-full text-center">
          <Link href="/login" className="text-[13px] font-bold text-primary hover:underline hover:text-primary/80 transition-colors">
            ← 학생 로그인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
