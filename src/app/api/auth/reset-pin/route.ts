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

    if (!student) {
      return NextResponse.json({ error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      isDefaultPin: student.pinCode === "0000",
    });
  } catch (error) {
    console.error("[GET /api/auth/reset-pin] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }

    const body = await req.json();
    const { newPin, confirmPin } = body as { newPin?: string; confirmPin?: string };

    if (!newPin || !confirmPin) {
      return NextResponse.json({ error: "새 PIN 번호를 입력해주세요." }, { status: 400 });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN 번호는 4자리 숫자이어야 합니다." }, { status: 400 });
    }

    if (newPin === "0000") {
      return NextResponse.json({ error: "초기 PIN 번호(0000) 외의 번호로 설정해주세요." }, { status: 400 });
    }

    if (newPin !== confirmPin) {
      return NextResponse.json({ error: "새 PIN 번호가 일치하지 않습니다." }, { status: 400 });
    }

    await prisma.student.update({
      where: { id: session.studentId },
      data: { pinCode: newPin },
    });

    return NextResponse.json({
      success: true,
      message: "PIN 번호가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-pin] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
