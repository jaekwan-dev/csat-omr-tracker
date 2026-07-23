import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "로그아웃 되었습니다." });

  // 세션 쿠키 만료 처리
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
