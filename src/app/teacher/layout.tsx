"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TeacherLogoutButton from "./TeacherLogoutButton";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/teacher/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/teacher",
      label: "성적 대시보드",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      ),
      exact: true,
    },
    {
      href: "/teacher/exams",
      label: "시험 등록·관리",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      exact: false,
    },
    {
      href: "/teacher/students",
      label: "학생·PIN 관리",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      exact: false,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <header style={styles.header}>
        <div className="container teacher-header-inner" style={styles.headerInner}>
          {/* Brand Logo */}
          <div style={styles.logoRow}>
            <div style={styles.logo}>
              <div style={styles.logoIconBox}>
                <span style={{ fontSize: 16 }}>🎯</span>
              </div>
              <div>
                <div style={styles.logoTitle}>OMR 관리자</div>
                <div style={styles.logoSub}>교사 전용</div>
              </div>
            </div>

            {/* Mobile-Only Logout position */}
            <div className="mobile-logout-only">
              <TeacherLogoutButton />
            </div>
          </div>

          {/* Floating Segmented Pill Control Navigation */}
          <nav className="teacher-segmented-nav" style={styles.segmentedNav}>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`teacher-nav-pill ${isActive ? "active" : ""}`}
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

          {/* Desktop Logout position */}
          <div className="desktop-logout-only">
            <TeacherLogoutButton />
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 64,
    gap: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    background: "linear-gradient(135deg, #0f766e, #0891b2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(8,145,178,0.25)",
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
    color: "#0f766e",
    lineHeight: 1.1,
  },
  segmentedNav: {
    display: "flex",
    alignItems: "center",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: 999,
    gap: "2px",
    border: "1px solid #e2e8f0",
  },
  navPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 16px",
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
    color: "#0f766e",
    fontWeight: 900,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
  },
};
