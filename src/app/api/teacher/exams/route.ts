import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";
import { Subject } from "@prisma/client";

// GET /api/teacher/exams → 전체 시험 목록 (정답 포함)
export async function GET(req: NextRequest) {
  if (!getTeacherSessionFromRequest(req)) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const exams = await prisma.exam.findMany({
    orderBy: [{ subject: "asc" }, { id: "asc" }],
    include: {
      questions: { orderBy: { questionNum: "asc" } },
      _count: { select: { submissions: true } },
    },
  });
  return NextResponse.json({ exams });
}

// POST /api/teacher/exams → 새 시험 생성
export async function POST(req: NextRequest) {
  if (!getTeacherSessionFromRequest(req)) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      subject,
      title,
      startNum,
      questions,
    } = body as {
      subject: Subject;
      title: string;
      startNum: number;
      questions: { questionNum: number; correctAnswer: number; score: number }[];
    };

    if (!subject || !title || !questions?.length) {
      return NextResponse.json({ error: "필수 입력값이 없습니다." }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        subject,
        title,
        totalQuestions: questions.length,
        startNum,
        questions: {
          create: questions.map((q) => ({
            questionNum: q.questionNum,
            correctAnswer: q.correctAnswer,
            score: q.score,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
