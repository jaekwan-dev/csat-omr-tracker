import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import OmrSheet from "./OmrSheet";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const examId = Number(id);
  if (isNaN(examId)) redirect("/");

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { questionNum: "asc" },
        select: {
          questionNum: true,
          score: true,
          // correctAnswer는 클라이언트에 노출하지 않음
        },
      },
    },
  });

  if (!exam) redirect("/");

  return <OmrSheet exam={exam} student={session} />;
}
