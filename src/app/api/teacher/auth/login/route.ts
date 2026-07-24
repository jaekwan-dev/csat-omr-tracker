import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || password !== (process.env.TEACHER_PASSWORD || "1234")) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    const token = await signJwt({ role: "teacher" }, "8h");
    const res = NextResponse.json({ ok: true });
    res.cookies.set("teacher_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8시간
    });
    return res;
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
