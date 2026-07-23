"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TeacherLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/teacher/auth/logout", { method: "POST" });
    router.push("/teacher/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-ghost btn-sm"
      style={{ borderColor: "#99f6e4", color: "#0f766e" }}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#0f766e", borderColor: "#99f6e4" }} /> : "로그아웃"}
    </button>
  );
}
