"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TeacherLogoutButton from "./TeacherLogoutButton";
import { cn } from "@/lib/utils";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/teacher/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/teacher",
      label: "대시보드",
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
      label: "시험 관리",
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
      label: "학생 관리",
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="mx-auto max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between min-h-[64px] py-3 md:py-2 gap-4 md:gap-0">
          
          {/* Brand Logo & Mobile Logout */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <div className="text-base font-black text-foreground leading-tight tracking-tight">OMR 관리자</div>
                <div className="text-[11px] font-bold text-primary leading-tight">교사 전용</div>
              </div>
            </div>

            {/* Mobile-Only Logout */}
            <div className="md:hidden">
              <TeacherLogoutButton />
            </div>
          </div>

          {/* Segmented Pill Navigation */}
          <nav className="flex items-center bg-secondary/70 p-1 rounded-full border border-border w-full md:w-auto overflow-x-auto overflow-y-hidden no-scrollbar">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none",
                    isActive
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Logout */}
          <div className="hidden md:block">
            <TeacherLogoutButton />
          </div>

        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
