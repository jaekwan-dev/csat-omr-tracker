import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // 1. 세션 확인
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const body = await req.json();
    const { examId, answers } = body as {
      examId?: number;
      answers?: Record<string, number>;
    };

    if (!examId || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "examId와 answers가 필요합니다." },
        { status: 400 }
      );
    }

    // 3. 시험 + 정답 조회
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { questionNum: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "해당 시험을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. 중복 제출 체크
    const existingSubmission = await prisma.submission.findFirst({
      where: { examId, studentId: session.studentId },
    });
    if (existingSubmission) {
      return NextResponse.json(
        { error: "이미 이 시험을 제출했습니다." },
        { status: 409 }
      );
    }

    // 5. 자동 채점
    let totalScore = 0;
    const results = exam.questions.map((q) => {
      const myAnswer = answers[String(q.questionNum)] ?? 0;
      const isCorrect = myAnswer === q.correctAnswer;
      const earnedScore = isCorrect ? q.score : 0;
      totalScore += earnedScore;

      return {
        questionNum: q.questionNum,
        correctAnswer: q.correctAnswer,
        myAnswer,
        isCorrect,
        score: q.score,
        earnedScore,
      };
    });

    // 6. Submission DB 저장
    const submission = await prisma.submission.create({
      data: {
        studentId: session.studentId,
        examId,
        answers,
        totalScore,
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
      totalScore,
      correctCount: results.filter((r) => r.isCorrect).length,
      wrongCount: results.filter((r) => !r.isCorrect).length,
      results,
    });
  } catch (error) {
    console.error("[POST /api/submissions] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
