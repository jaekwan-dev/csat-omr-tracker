import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";

interface Params { params: Promise<{ id: string }> }

// GET /api/teacher/exams/[id] → 시험 단일 조회
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const examId = Number(id);

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { questionNum: "asc" } } },
    });
    if (!exam) return NextResponse.json({ error: "시험을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ exam });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PUT /api/teacher/exams/[id] → 시험 수정 (정답/배점 업데이트)
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const examId = Number(id);

  try {
    const body = await req.json();
    const { title, explanationPdfUrl, questions } = body as {
      title?: string;
      explanationPdfUrl?: string;
      questions?: { questionNum: number; correctAnswer: number; score: number; isSubjective?: boolean }[];
    };

    await prisma.$transaction(async (tx) => {
      if (title || explanationPdfUrl !== undefined) {
        const updateData: any = {};
        if (title) updateData.title = title;
        if (explanationPdfUrl !== undefined) updateData.explanationPdfUrl = explanationPdfUrl;
        await tx.exam.update({ where: { id: examId }, data: updateData });
      }
      if (questions) {
        // 기존 문항 삭제 후 재생성
        await tx.question.deleteMany({ where: { examId } });
        await tx.question.createMany({
          data: questions.map((q) => ({ examId, ...q })),
        });
        await tx.exam.update({
          where: { id: examId },
          data: { totalQuestions: questions.length },
        });
      }
    });

    const updated = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { questionNum: "asc" } } },
    });

    revalidatePath("/teacher/exams");
    revalidatePath("/");

    return NextResponse.json({ exam: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/teacher/exams/[id] → 시험 삭제
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const examId = Number(id);

  try {
    // submission → question → exam 순으로 삭제
    await prisma.submission.deleteMany({ where: { examId } });
    await prisma.question.deleteMany({ where: { examId } });
    await prisma.exam.delete({ where: { id: examId } });
    
    revalidatePath("/teacher/exams");
    revalidatePath("/");
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/teacher/exams/[id] → 시험 출시 상태 변경
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const examId = Number(id);

  try {
    const { isPublished } = await req.json();
    if (typeof isPublished !== "boolean") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: { isPublished },
    });
    
    revalidatePath("/teacher/exams");
    revalidatePath("/");
    
    return NextResponse.json({ exam: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
