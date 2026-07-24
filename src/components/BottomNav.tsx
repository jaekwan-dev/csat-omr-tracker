"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={styles.bottomNav}>
      <Link href="/" style={styles.linkWrapper}>
        <div style={{ ...styles.navItem, ...(pathname === "/" ? styles.navItemActive : {}) }}>
          <span style={styles.navIcon}>🏠</span>
          <span style={styles.navLabel}>홈</span>
        </div>
      </Link>
      <Link href="/history" style={styles.linkWrapper}>
        <div style={{ ...styles.navItem, ...(pathname === "/history" ? styles.navItemActive : {}) }}>
          <span style={styles.navIcon}>📊</span>
          <span style={styles.navLabel}>학습 이력</span>
        </div>
      </Link>
      <Link href="#" style={styles.linkWrapper}>
        <div style={styles.navItem}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>내 정보</span>
        </div>
      </Link>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-around",
    padding: "12px 0 20px",
  },
  linkWrapper: {
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    flex: 1,
    justifyContent: "center",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: "6px 24px",
    borderRadius: 12,
    transition: "all 0.15s",
  },
  navItemActive: {
    background: "#eff6ff",
  },
  navIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
  },
};
