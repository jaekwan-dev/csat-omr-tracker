import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const submissions = await prisma.submission.findMany({
      where: { studentId: session.studentId },
      orderBy: { submittedAt: "asc" },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { questionNum: "asc" },
            },
          },
        },
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json({
        hasData: false,
        summary: {
          totalExams: 0,
          overallAvgScore: 0,
          highestScore: 0,
          overallAccuracy: 0,
        },
        subjectStats: {},
        chartData: [],
      });
    }

    let grandTotalEarned = 0;
    let grandTotalMax = 0;
    let highestScoreOverall = 0;

    const subjectMap: Record<
      string,
      {
        count: number;
        totalScoreSum: number;
        maxScoreSum: number;
        highestScore: number;
        scores: { title: string; score: number; maxScore: number; date: string }[];
      }
    > = {
      KOREAN: { count: 0, totalScoreSum: 0, maxScoreSum: 0, highestScore: 0, scores: [] },
      MATH: { count: 0, totalScoreSum: 0, maxScoreSum: 0, highestScore: 0, scores: [] },
      ENGLISH: { count: 0, totalScoreSum: 0, maxScoreSum: 0, highestScore: 0, scores: [] },
    };

    const chartData = submissions.map((sub) => {
      const examMaxScore = sub.exam.questions.reduce((sum, q) => sum + q.score, 0);
      const scorePercent = examMaxScore > 0 ? Math.round((sub.totalScore / examMaxScore) * 100) : 0;
      const formattedDate = new Date(sub.submittedAt).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
      });

      grandTotalEarned += sub.totalScore;
      grandTotalMax += examMaxScore;
      if (sub.totalScore > highestScoreOverall) {
        highestScoreOverall = sub.totalScore;
      }

      const subj = sub.exam.subject;
      if (!subjectMap[subj]) {
        subjectMap[subj] = { count: 0, totalScoreSum: 0, maxScoreSum: 0, highestScore: 0, scores: [] };
      }
      subjectMap[subj].count += 1;
      subjectMap[subj].totalScoreSum += sub.totalScore;
      subjectMap[subj].maxScoreSum += examMaxScore;
      if (sub.totalScore > subjectMap[subj].highestScore) {
        subjectMap[subj].highestScore = sub.totalScore;
      }
      subjectMap[subj].scores.push({
        title: sub.exam.title,
        score: sub.totalScore,
        maxScore: examMaxScore,
        date: formattedDate,
      });

      return {
        id: sub.id,
        examId: sub.examId,
        subject: sub.exam.subject,
        title: sub.exam.title,
        score: sub.totalScore,
        maxScore: examMaxScore,
        scorePercent,
        date: formattedDate,
        submittedAt: sub.submittedAt,
      };
    });

    const subjectStats: Record<string, any> = {};
    Object.keys(subjectMap).forEach((subj) => {
      const data = subjectMap[subj];
      if (data.count > 0) {
        const avgScore = Math.round(data.totalScoreSum / data.count);
        const accuracy = data.maxScoreSum > 0 ? Math.round((data.totalScoreSum / data.maxScoreSum) * 100) : 0;
        const recent = data.scores[data.scores.length - 1];
        const previous = data.scores.length > 1 ? data.scores[data.scores.length - 2] : null;
        const trend = previous ? recent.score - previous.score : 0;

        subjectStats[subj] = {
          count: data.count,
          avgScore,
          highestScore: data.highestScore,
          accuracy,
          recentScore: recent.score,
          recentMaxScore: recent.maxScore,
          trend,
        };
      }
    });

    const summary = {
      totalExams: submissions.length,
      overallAvgScore: Math.round(grandTotalEarned / submissions.length),
      highestScore: highestScoreOverall,
      overallAccuracy: grandTotalMax > 0 ? Math.round((grandTotalEarned / grandTotalMax) * 100) : 0,
    };

    return NextResponse.json({
      hasData: true,
      summary,
      subjectStats,
      chartData,
    });
  } catch (error) {
    console.error("[GET /api/submissions/stats] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
