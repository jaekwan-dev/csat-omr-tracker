import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";
import { Subject } from "@prisma/client";

// GET /api/teacher/exams → 전체 시험 목록 (정답 포함)
export async function GET(req: NextRequest) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const rawExams = await prisma.exam.findMany({
      orderBy: [{ subject: "asc" }, { id: "asc" }],
      include: {
        questions: { orderBy: { questionNum: "asc" } },
        submissions: { select: { totalScore: true } },
        _count: { select: { submissions: true } },
      },
    });

    const exams = rawExams.map(exam => {
      const scores = exam.submissions.map(s => s.totalScore);
      const submissionCount = scores.length;
      let avg = 0, max = 0, min = 0;
      if (submissionCount > 0) {
        max = Math.max(...scores);
        min = Math.min(...scores);
        avg = Math.round((scores.reduce((a, b) => a + b, 0) / submissionCount) * 10) / 10;
      }
      return {
        ...exam,
        stats: { avg, max, min, submissionCount },
        submissions: undefined, // remove raw submissions from payload
      };
    });

    return NextResponse.json({ exams });
  } catch (e: any) {
    console.error("GET /api/teacher/exams Error:", e);
    return NextResponse.json({ error: "서버 오류: " + e.message }, { status: 500 });
  }
}

// POST /api/teacher/exams → 새 시험 생성
export async function POST(req: NextRequest) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      subject,
      title,
      startNum,
      explanationPdfUrl,
      questions,
    } = body as {
      subject: Subject;
      title: string;
      startNum: number;
      explanationPdfUrl?: string;
      questions: { questionNum: number; correctAnswer: number; score: number; isSubjective?: boolean }[];
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
        explanationPdfUrl,
        questions: {
          create: questions.map((q) => ({
            questionNum: q.questionNum,
            correctAnswer: q.correctAnswer,
            score: q.score,
            isSubjective: q.isSubjective ?? false,
          })),
        },
      },
      include: { questions: true },
    });

    revalidatePath("/teacher/exams");
    revalidatePath("/");

    return NextResponse.json({ exam }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
