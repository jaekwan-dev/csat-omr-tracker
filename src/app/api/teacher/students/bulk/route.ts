import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSessionFromRequest } from "@/lib/teacherSession";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  if (!(await getTeacherSessionFromRequest(req))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "CSV 파일이 없습니다." }, { status: 400 });
    }

    const fileContent = await file.text();
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true, // Handle UTF-8 BOM
    }) as { 학번?: string; 이름?: string; 학년?: string; 반?: string }[];

    if (!records.length) {
      return NextResponse.json({ error: "유효한 데이터가 없습니다." }, { status: 400 });
    }

    // Prepare data
    const studentsData = records.map((record) => {
      const id = record["학번"]?.trim();
      const name = record["이름"]?.trim();
      const grade = parseInt(record["학년"] || "0", 10);
      const classNum = parseInt(record["반"] || "0", 10);
      
      // 초기 PIN 번호는 "0000"으로 설정
      const pinCode = "0000";

      if (!id || !name || isNaN(grade) || isNaN(classNum)) {
        throw new Error("CSV 데이터 양식이 올바르지 않습니다. (학번, 이름, 학년, 반)");
      }

      return { id, name, grade, classNum, pinCode };
    });

    // Transaction (upsert)
    const results = await prisma.$transaction(
      studentsData.map((data) =>
        prisma.student.upsert({
          where: { id: data.id },
          update: {
            name: data.name,
            grade: data.grade,
            classNum: data.classNum,
          },
          create: data,
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
