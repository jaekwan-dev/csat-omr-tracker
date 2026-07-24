"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore error
    }
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-ghost btn-sm"
    >
      {loading ? (
        <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#64748b", borderColor: "#e2e8f0" }} />
      ) : (
        "로그아웃"
      )}
    </button>
  );
}
