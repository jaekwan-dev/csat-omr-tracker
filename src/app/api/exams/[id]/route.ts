import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // 세션 확인
    const session = req.cookies.get("session");
    if (!session?.value) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const examId = Number(id);
    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "유효하지 않은 시험 ID입니다." },
        { status: 400 }
      );
    }

    // ?withAnswers=true 쿼리 파라미터가 있는 경우에만 정답 포함
    const { searchParams } = new URL(req.url);
    const withAnswers = searchParams.get("withAnswers") === "true";

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { questionNum: "asc" },
          select: {
            id: true,
            questionNum: true,
            score: true,
            // 정답은 withAnswers 파라미터가 true일 때만 포함
            ...(withAnswers ? { correctAnswer: true } : {}),
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "해당 시험을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error("[GET /api/exams/[id]] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
