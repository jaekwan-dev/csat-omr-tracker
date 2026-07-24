import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, grade, classNum, pinCode } = body as {
      name?: string;
      grade?: number;
      classNum?: number;
      pinCode?: string;
    };

    const student = await prisma.student.update({
      where: { id },
      data: { name, grade, classNum, pinCode },
      include: { _count: { select: { submissions: true } } }
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. 해당 학생의 모든 제출 이력 삭제
    await prisma.submission.deleteMany({
      where: { studentId: id }
    });

    // 2. 학생 데이터 삭제
    await prisma.student.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
