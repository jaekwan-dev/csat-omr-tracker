import "dotenv/config";
import { PrismaClient, Subject } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("Seeding database...");

  // 1. 기존 데이터 삭제 (Clean up)
  await prisma.submission.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.student.deleteMany({});

  console.log("Cleared existing data.");

  // 2. 학생 데이터 추가
  const students = [
    { id: "1101", name: "김철수", grade: 1, classNum: 1 },
    { id: "1102", name: "이영희", grade: 1, classNum: 1 },
    { id: "1201", name: "박민수", grade: 1, classNum: 2 },
    { id: "2101", name: "최지우", grade: 2, classNum: 1 },
  ];

  for (const student of students) {
    await prisma.student.create({ data: student });
  }
  console.log(`Created ${students.length} students.`);

  // 3. 국어 1회차 시험 추가 (30문항, 1-30번)
  const koreanExam = await prisma.exam.create({
    data: {
      subject: Subject.KOREAN,
      title: "1회차",
      totalQuestions: 30,
      startNum: 1,
    },
  });

  const koreanQuestions = Array.from({ length: 30 }, (_, i) => {
    const questionNum = i + 1;
    const correctAnswer = (questionNum % 5) + 1;
    const score = questionNum <= 20 ? 3 : 4;
    return {
      examId: koreanExam.id,
      questionNum,
      correctAnswer,
      score,
    };
  });

  await prisma.question.createMany({ data: koreanQuestions });
  console.log("Created Korean Exam (30 Questions).");

  // 4. 수학 1회차 시험 추가 (20문항, 1-20번)
  const mathExam = await prisma.exam.create({
    data: {
      subject: Subject.MATH,
      title: "1회차",
      totalQuestions: 20,
      startNum: 1,
    },
  });

  const mathQuestions = Array.from({ length: 20 }, (_, i) => {
    const questionNum = i + 1;
    const correctAnswer = ((questionNum * 2) % 5) + 1;
    const score = questionNum <= 10 ? 4 : 6;
    return {
      examId: mathExam.id,
      questionNum,
      correctAnswer,
      score,
    };
  });

  await prisma.question.createMany({ data: mathQuestions });
  console.log("Created Math Exam (20 Questions).");

  // 5. 영어 기출 시험 추가 (28문항, 18-45번)
  const englishExam = await prisma.exam.create({
    data: {
      subject: Subject.ENGLISH,
      title: "2024년 6월 기출",
      totalQuestions: 28,
      startNum: 18,
    },
  });

  const englishQuestions = Array.from({ length: 28 }, (_, i) => {
    const questionNum = i + 18; // 18번부터 시작
    const correctAnswer = ((questionNum + 3) % 5) + 1;
    const score = i % 2 === 0 ? 2 : 3; // 2점과 3점 교대
    return {
      examId: englishExam.id,
      questionNum,
      correctAnswer,
      score,
    };
  });

  await prisma.question.createMany({ data: englishQuestions });
  console.log("Created English Exam (28 Questions, starting from #18).");

  console.log("Database seed completed successfully! 🚀");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
