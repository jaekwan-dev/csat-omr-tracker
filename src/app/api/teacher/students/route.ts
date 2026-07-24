import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";

export async function GET(req: NextRequest) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const students = await prisma.student.findMany({
      orderBy: [
        { grade: "asc" },
        { classNum: "asc" },
        { id: "asc" },
      ],
      include: {
        _count: { select: { submissions: true } }
      }
    });
    return NextResponse.json({ students });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, grade, classNum, pinCode } = body as {
      id: string;
      name: string;
      grade: number;
      classNum: number;
      pinCode: string;
    };

    if (!id || !name || !grade || !classNum || !pinCode) {
      return NextResponse.json({ error: "필수 입력값이 누락되었습니다." }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 학번입니다." }, { status: 409 });
    }

    const student = await prisma.student.create({
      data: { id, name, grade, classNum, pinCode },
      include: { _count: { select: { submissions: true } } }
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
