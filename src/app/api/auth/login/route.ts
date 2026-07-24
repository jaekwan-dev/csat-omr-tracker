import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, name, pinCode } = body as { studentId?: string; name?: string; pinCode?: string };

    if (!studentId || !name || !pinCode) {
      return NextResponse.json(
        { error: "학번, 이름, PIN 번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.name !== name || student.pinCode !== pinCode) {
      return NextResponse.json(
        { error: "학번, 이름 또는 PIN 번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // JWT 세션 페이로드
    const token = await signJwt({
      studentId: student.id,
      name: student.name,
      grade: student.grade,
      classNum: student.classNum,
    });

    const response = NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        classNum: student.classNum,
      },
    });

    // HttpOnly 세션 쿠키 설정 (7일 만료)
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
