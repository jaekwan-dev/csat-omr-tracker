import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 교사 보호 경로: /teacher (login 제외)
  if (pathname.startsWith("/teacher") && !pathname.startsWith("/teacher/login")) {
    const teacherSession = req.cookies.get("teacher_session");
    if (!teacherSession?.value) {
      return NextResponse.redirect(new URL("/teacher/login", req.url));
    }
    const payload = await verifyJwt(teacherSession.value);
    if (payload?.role !== "teacher") {
      return NextResponse.redirect(new URL("/teacher/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*"],
};
