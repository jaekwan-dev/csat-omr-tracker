"use client";

import { useState } from "react";

export default function TeacherLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/teacher/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    // 하드 리다이렉트로 세션 및 캐시 초기화
    window.location.href = "/teacher/login";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-ghost btn-sm"
      style={{ borderColor: "#99f6e4", color: "#0f766e" }}
    >
      {loading ? (
        <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#0f766e", borderColor: "#99f6e4" }} />
      ) : (
        "로그아웃"
      )}
    </button>
  );
}
