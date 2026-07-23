import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 세션 확인
    const session = req.cookies.get("session");
    if (!session?.value) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject"); // KOREAN | MATH | ENGLISH (optional)

    const exams = await prisma.exam.findMany({
      where: subject ? { subject: subject as "KOREAN" | "MATH" | "ENGLISH" } : undefined,
      orderBy: [{ subject: "asc" }, { id: "asc" }],
      select: {
        id: true,
        subject: true,
        title: true,
        totalQuestions: true,
        startNum: true,
        _count: {
          select: { questions: true, submissions: true },
        },
      },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("[GET /api/exams] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
