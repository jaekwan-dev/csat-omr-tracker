"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

export default function TeacherLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/teacher/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/teacher/login";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:text-teal-800 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      로그아웃
    </button>
  );
}
