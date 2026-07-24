"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/LogoutButton";
import PinResetModal from "./PinResetModal";

interface SessionInfo {
  name: string;
  grade: number;
  classNum: number;
}

export default function StudentHeader({ session }: { session?: SessionInfo }) {
  const pathname = usePathname();

  // sessionStorage 캐시를 통한 즉시 동기적 로딩 (페이지 전환 시 0ms 지연 및 재로딩 현상 완벽 제거)
  const [userSession, setUserSession] = useState<SessionInfo | undefined>(() => {
    if (session) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("student_session", JSON.stringify(session));
        } catch {}
      }
      return session;
    }
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("student_session");
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }
    return undefined;
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    // 세션 정보 및 PIN 0000 여부 백그라운드 업데이트
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserSession(data.user);
          try {
            sessionStorage.setItem("student_session", JSON.stringify(data.user));
          } catch {}
        }
        if (data.isDefaultPin) {
          setIsPinModalOpen(true);
        }
      })
      .catch(() => {});
  }, [session]);

  const navItems = [
    {
      href: "/",
      label: "시험 선택",
      exact: true,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/history",
      label: "학습 이력",
      exact: false,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      href: "/stats",
      label: "성적 통계",
      exact: false,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header style={styles.header}>
        <div className="container" style={styles.headerContainer}>
          {/* Tier 1: 제일 상단바 (좌측 브랜드 로고 / 우측 학생 이름·반 & 로그아웃) */}
          <div style={styles.topBar}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={styles.logo}>
                <div style={styles.logoIconBox}>
                  <span style={{ fontSize: 16 }}>🎯</span>
                </div>
                <div>
                  <div style={styles.logoTitle}>수능 OMR</div>
                  <div style={styles.logoSub}>학생 전용</div>
                </div>
              </div>
            </Link>

            {/* 우측 최상단: 프로필 & 로그아웃 (0ms 즉시 유지 노출) */}
            <div style={styles.userSection}>
              {userSession ? (
                <div style={styles.userRow}>
                  <div style={styles.avatar}>
                    {userSession.name.charAt(0)}
                  </div>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>{userSession.name}</span>
                    <span style={styles.userMeta}>{userSession.grade}학년 {userSession.classNum}반</span>
                  </div>
                </div>
              ) : (
                <div style={styles.userRow}>
                  <div style={{ ...styles.avatar, background: "#cbd5e1" }}>?</div>
                </div>
              )}
              <LogoutButton />
            </div>
          </div>

          {/* Tier 2: 제일 상단바 바로 아래에 배치되는 중앙 세그먼티드 메뉴 */}
          <div style={styles.navBarTier}>
            <nav style={styles.segmentedNav}>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      ...styles.navPill,
                      ...(isActive ? styles.navPillActive : {}),
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* PIN 번호가 0000일 경우 강제 변경 팝업 모달 */}
      <PinResetModal
        isOpen={isPinModalOpen}
        onSuccess={() => setIsPinModalOpen(false)}
      />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid #cbd5e1",
    boxShadow: "0 2px 14px rgba(0, 0, 0, 0.04)",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
  },

  /* Tier 1: Top Bar */
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(59,130,246,0.3)",
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2563eb",
    lineHeight: 1.1,
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },
  userMeta: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },

  /* Tier 2: Navigation Bar below Top Bar */
  navBarTier: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    paddingTop: 2,
  },
  segmentedNav: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: 999,
    gap: "4px",
    border: "1px solid #cbd5e1",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },
  navPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 20px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    textDecoration: "none",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
  },
  navPillActive: {
    background: "#ffffff",
    color: "#2563eb",
    fontWeight: 900,
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.18), 0 1px 2px rgba(0, 0, 0, 0.04)",
  },
};
