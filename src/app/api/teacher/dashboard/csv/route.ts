import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";

// GET /api/teacher/dashboard/csv?examId=1
export async function GET(req: NextRequest) {
  if (!getTeacherSessionFromRequest(req)) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = Number(searchParams.get("examId"));
  if (isNaN(examId)) {
    return NextResponse.json({ error: "examId가 필요합니다." }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { questionNum: "asc" } } },
  });
  if (!exam) return NextResponse.json({ error: "시험 없음" }, { status: 404 });

  const maxScore = exam.questions.reduce((s, q) => s + q.score, 0);
  const submissions = await prisma.submission.findMany({
    where: { examId },
    include: { student: true },
    orderBy: { totalScore: "desc" },
  });

  // CSV 헤더
  const qHeaders = exam.questions.map((q) => `${q.questionNum}번 답`).join(",");
  const header = `석차,학번,이름,학년,반,총점,만점,정답률(%),${qHeaders},제출일시\n`;

  let rank = 1;
  const rows = submissions.map((sub, idx) => {
    if (idx > 0 && sub.totalScore < submissions[idx - 1].totalScore) rank = idx + 1;
    const answers = sub.answers as Record<string, number>;
    const answerCols = exam.questions.map((q) => answers[String(q.questionNum)] ?? "").join(",");
    const percent = maxScore > 0 ? Math.round((sub.totalScore / maxScore) * 100) : 0;
    const date = new Date(sub.submittedAt).toLocaleString("ko-KR");
    return `${rank},${sub.student.id},${sub.student.name},${sub.student.grade},${sub.student.classNum},${sub.totalScore},${maxScore},${percent},${answerCols},"${date}"`;
  });

  const csv = "\uFEFF" + header + rows.join("\n"); // BOM for Excel Korean

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(exam.title)}_성적.csv"`,
    },
  });
}
