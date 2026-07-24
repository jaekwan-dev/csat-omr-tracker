import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const submissions = await prisma.submission.findMany({
      where: { studentId: session.studentId },
      orderBy: { submittedAt: "desc" },
      include: {
        exam: {
          select: {
            subject: true,
            title: true,
            totalQuestions: true,
            questions: {
              select: {
                score: true
              }
            }
          }
        }
      }
    });

    const mappedSubmissions = submissions.map(sub => {
      const maxScore = sub.exam.questions.reduce((sum, q) => sum + q.score, 0);
      return {
        id: sub.id,
        examId: sub.examId,
        subject: sub.exam.subject,
        title: sub.exam.title,
        totalQuestions: sub.exam.totalQuestions,
        totalScore: sub.totalScore,
        maxScore,
        submittedAt: sub.submittedAt,
      };
    });

    return NextResponse.json({ submissions: mappedSubmissions });
  } catch (error) {
    console.error("[GET /api/submissions/history] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
