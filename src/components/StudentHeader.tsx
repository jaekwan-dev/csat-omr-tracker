"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/LogoutButton";
import PinResetModal from "./PinResetModal";
import { Target, FileText, CheckCircle2, LayoutGrid, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionInfo {
  name: string;
  grade: number;
  classNum: number;
}

export default function StudentHeader({ session }: { session?: SessionInfo }) {
  const pathname = usePathname();

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
      icon: CheckSquare,
    },
    {
      href: "/history",
      label: "학습 이력",
      exact: false,
      icon: FileText,
    },
    {
      href: "/stats",
      label: "성적 통계",
      exact: false,
      icon: LayoutGrid,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-white">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-black text-foreground leading-tight tracking-tight">수능 OMR</span>
                <span className="text-[10px] font-bold text-primary leading-tight">학생 전용</span>
              </div>
            </Link>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3">
              {userSession ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-right justify-center">
                    <span className="text-xs font-black text-foreground leading-tight">{userSession.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground leading-tight">{userSession.grade}학년 {userSession.classNum}반</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {userSession.name.charAt(0)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-bold text-xs">
                    ?
                  </div>
                </div>
              )}
              <div className="h-6 w-px bg-border mx-1" />
              <LogoutButton />
            </div>
          </div>

          {/* Segmented Navigation */}
          <div className="flex justify-center w-full pb-1">
            <nav className="inline-flex items-center justify-center bg-secondary/50 p-1 rounded-full border border-border shadow-inner gap-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      isActive 
                        ? "bg-background text-primary shadow-sm ring-1 ring-border" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

        </div>
      </header>

      {/* PIN Reset Modal */}
      <PinResetModal
        isOpen={isPinModalOpen}
        onSuccess={() => setIsPinModalOpen(false)}
      />
    </>
  );
}
