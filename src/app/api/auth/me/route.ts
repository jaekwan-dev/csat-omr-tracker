import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: { pinCode: true },
    });

    return NextResponse.json({
      user: session,
      isDefaultPin: student?.pinCode === "0000",
    });
  } catch (error) {
    console.error("[GET /api/auth/me] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
