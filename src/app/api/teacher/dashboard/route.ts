import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";

// GET /api/teacher/dashboard?examId=1  → 해당 시험 응시자 전체 성적
// GET /api/teacher/dashboard?studentId=1101 → 해당 학생의 전체 시험 이력
export async function GET(req: NextRequest) {
  if (!getTeacherSessionFromRequest(req)) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");

  // ── 학생별 성적 이력 (차트용) ──
  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "학생 없음" }, { status: 404 });

    const submissions = await prisma.submission.findMany({
      where: { studentId },
      include: {
        exam: { select: { id: true, subject: true, title: true, questions: { select: { score: true } } } },
      },
      orderBy: { submittedAt: "asc" },
    });

    const examIds = submissions.map((s) => s.examId);

    // 해당 시험들의 전체 제출 데이터 (학급/전체 평균 계산용)
    const allExamSubmissions = examIds.length > 0
      ? await prisma.submission.findMany({
          where: { examId: { in: examIds } },
          include: { student: { select: { grade: true, classNum: true } } },
        })
      : [];

    // examId 별로 그룹화
    const byExam: Record<number, typeof allExamSubmissions> = {};
    for (const sub of allExamSubmissions) {
      if (!byExam[sub.examId]) byExam[sub.examId] = [];
      byExam[sub.examId].push(sub);
    }

    const history = submissions.map((sub) => {
      const maxScore = sub.exam.questions.reduce((s, q) => s + q.score, 0);
      const examSubs = byExam[sub.examId] ?? [];

      // 학급 평균: 같은 학년 + 같은 반
      const classSubs = examSubs.filter(
        (s) => s.student.grade === student.grade && s.student.classNum === student.classNum
      );
      const classAvgScore = classSubs.length > 0
        ? Math.round(classSubs.reduce((s, e) => s + e.totalScore, 0) / classSubs.length)
        : 0;

      // 전체 평균
      const overallAvgScore = examSubs.length > 0
        ? Math.round(examSubs.reduce((s, e) => s + e.totalScore, 0) / examSubs.length)
        : 0;

      return {
        examId: sub.examId,
        subject: sub.exam.subject,
        examTitle: sub.exam.title,
        totalScore: sub.totalScore,
        maxScore,
        percent: maxScore > 0 ? Math.round((sub.totalScore / maxScore) * 100) : 0,
        classAvgScore,
        classAvgPercent: maxScore > 0 ? Math.round((classAvgScore / maxScore) * 100) : 0,
        overallAvgScore,
        overallAvgPercent: maxScore > 0 ? Math.round((overallAvgScore / maxScore) * 100) : 0,
        classCount: classSubs.length,
        submittedAt: sub.submittedAt.toISOString(),
      };
    });

    return NextResponse.json({ student, history });
  }


  // ── 시험별 전체 응시자 성적 ──
  if (!examId || isNaN(Number(examId))) {
    return NextResponse.json({ error: "examId 또는 studentId가 필요합니다." }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: Number(examId) },
    include: { questions: { orderBy: { questionNum: "asc" } } },
  });

  if (!exam) return NextResponse.json({ error: "시험 없음" }, { status: 404 });

  const maxScore = exam.questions.reduce((s, q) => s + q.score, 0);

  const submissions = await prisma.submission.findMany({
    where: { examId: Number(examId) },
    include: { student: true },
    orderBy: { totalScore: "desc" },
  });

  let rank = 1;
  const rows = submissions.map((sub, idx) => {
    if (idx > 0 && sub.totalScore < submissions[idx - 1].totalScore) rank = idx + 1;
    const answers = sub.answers as Record<string, number>;
    let correctCount = 0, wrongCount = 0, unansweredCount = 0;
    for (const q of exam.questions) {
      const my = answers[String(q.questionNum)] ?? 0;
      if (my === 0) unansweredCount++;
      else if (my === q.correctAnswer) correctCount++;
      else wrongCount++;
    }
    return {
      rank,
      studentId: sub.student.id,
      studentName: sub.student.name,
      grade: sub.student.grade,
      classNum: sub.student.classNum,
      totalScore: sub.totalScore,
      maxScore,
      correctCount,
      wrongCount,
      unansweredCount,
      percent: maxScore > 0 ? Math.round((sub.totalScore / maxScore) * 100) : 0,
      submittedAt: sub.submittedAt.toISOString(),
    };
  });

  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.totalScore, 0) / rows.length)
      : 0;

  // ── 문항별 오답률 통계 ──
  const total = submissions.length;
  const questionStats = exam.questions.map((q) => {
    let correctCount = 0, wrongCount = 0, unansweredCount = 0;
    for (const sub of submissions) {
      const answers = sub.answers as Record<string, number>;
      const my = answers[String(q.questionNum)] ?? 0;
      if (my === 0) unansweredCount++;
      else if (my === q.correctAnswer) correctCount++;
      else wrongCount++;
    }
    return {
      questionNum: q.questionNum,
      correctAnswer: q.correctAnswer,
      score: q.score,
      correctCount,
      wrongCount,
      unansweredCount,
      totalSubmissions: total,
      correctRate: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      wrongRate: total > 0 ? Math.round((wrongCount / total) * 100) : 0,
      unansweredRate: total > 0 ? Math.round((unansweredCount / total) * 100) : 0,
    };
  });

  return NextResponse.json({
    exam: {
      id: exam.id,
      subject: exam.subject,
      title: exam.title,
      totalQuestions: exam.totalQuestions,
      maxScore,
    },
    avgScore,
    submissions: rows,
    questionStats,
  });
}

