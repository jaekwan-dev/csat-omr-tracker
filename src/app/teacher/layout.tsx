import Link from "next/link";
import TeacherLogoutButton from "./TeacherLogoutButton";

// 인증 체크는 middleware.ts에서 처리
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0fdfa", display: "flex", flexDirection: "column" }}>
      <header style={styles.header}>
        <div className="container teacher-header-inner" style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📋</span>
            <span style={styles.logoText}>수능 OMR 교사</span>
            <span style={styles.logoBadge}>관리자</span>
          </div>
          <nav className="teacher-nav" style={styles.nav}>
            <Link href="/teacher" className="teacher-nav-link" style={styles.navLink}>📊 대시보드</Link>
            <Link href="/teacher/exams" className="teacher-nav-link" style={styles.navLink}>✏️ 시험 관리</Link>
            <Link href="/teacher/students" className="teacher-nav-link" style={styles.navLink}>👥 학생 관리</Link>
          </nav>
          <TeacherLogoutButton />
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky", top: 0, zIndex: 50,
    background: "rgba(240,253,250,0.92)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid #99f6e4",
  },
  headerInner: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", height: 64, gap: 20,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 17, fontWeight: 900, color: "#0f766e", letterSpacing: "-0.02em" },
  logoBadge: {
    background: "#ccfbf1", color: "#0f766e",
    fontSize: 11, fontWeight: 800, padding: "3px 8px",
    borderRadius: 999, letterSpacing: "0.05em",
  },
  nav: { display: "flex", gap: 4 },
  navLink: {
    padding: "8px 16px", borderRadius: 10,
    fontSize: 14, fontWeight: 600, color: "#0f766e",
    transition: "all 0.15s",
  },
};
