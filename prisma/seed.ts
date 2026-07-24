import "dotenv/config";
import { PrismaClient, Subject } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with rich sample data...");

  // 1. 기존 데이터 초기화 (Clean up)
  await prisma.submission.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.student.deleteMany({});

  console.log("Cleared existing database records.");

  // 2. 학생 데이터 생성 (10명, 다양한 학년 및 반)
  const students = [
    { id: "1101", name: "김철수", grade: 1, classNum: 1, pinCode: "1234" },
    { id: "1102", name: "이영희", grade: 1, classNum: 1, pinCode: "1234" },
    { id: "1103", name: "정우성", grade: 1, classNum: 1, pinCode: "1234" },
    { id: "1104", name: "한지민", grade: 1, classNum: 1, pinCode: "1234" },
    { id: "1201", name: "박민수", grade: 1, classNum: 2, pinCode: "1234" },
    { id: "1202", name: "김태희", grade: 1, classNum: 2, pinCode: "1234" },
    { id: "1203", name: "송중기", grade: 1, classNum: 2, pinCode: "1234" },
    { id: "2101", name: "최지우", grade: 2, classNum: 1, pinCode: "1234" },
    { id: "2102", name: "이병헌", grade: 2, classNum: 1, pinCode: "1234" },
    { id: "2103", name: "손예진", grade: 2, classNum: 1, pinCode: "1234" },
  ];

  for (const student of students) {
    await prisma.student.create({ data: student });
  }
  console.log(`Created ${students.length} sample students.`);

  // 3. 시험 목록 정의
  const examSpecs = [
    // 국어 (1~30번)
    { subject: Subject.KOREAN, title: "1회차 모의고사", totalQuestions: 30, startNum: 1 },
    { subject: Subject.KOREAN, title: "2회차 모의고사", totalQuestions: 30, startNum: 1 },
    { subject: Subject.KOREAN, title: "3회차 모의고사", totalQuestions: 30, startNum: 1 },
    // 수학 (1~20번)
    { subject: Subject.MATH, title: "1회차 모의고사", totalQuestions: 20, startNum: 1 },
    { subject: Subject.MATH, title: "2회차 모의고사", totalQuestions: 20, startNum: 1 },
    { subject: Subject.MATH, title: "3회차 모의고사", totalQuestions: 20, startNum: 1 },
    // 영어 (18~45번)
    { subject: Subject.ENGLISH, title: "1회차 모의고사", totalQuestions: 28, startNum: 18 },
    { subject: Subject.ENGLISH, title: "2회차 모의고사", totalQuestions: 28, startNum: 18 },
    { subject: Subject.ENGLISH, title: "2024년 6월 기출", totalQuestions: 28, startNum: 18 },
  ];

  const createdExams = [];

  for (const spec of examSpecs) {
    const exam = await prisma.exam.create({
      data: {
        subject: spec.subject,
        title: spec.title,
        totalQuestions: spec.totalQuestions,
        startNum: spec.startNum,
      },
    });

    const questions = Array.from({ length: spec.totalQuestions }, (_, i) => {
      const qNum = spec.startNum + i;
      const isSubjective = spec.subject === Subject.MATH && qNum >= 16; // 수학 16번 이상 주관식
      const correctAnswer = isSubjective
        ? (qNum * 7) % 100 // 주관식 정답 (예: 12, 19, 26...)
        : ((qNum + (spec.title.charCodeAt(0) || 0)) % 5) + 1; // 1~5 객관식

      let score = 3;
      if (spec.subject === Subject.KOREAN) score = i < 20 ? 3 : 4;
      else if (spec.subject === Subject.MATH) score = isSubjective ? 6 : 4;
      else if (spec.subject === Subject.ENGLISH) score = i % 2 === 0 ? 3 : 4;

      return {
        examId: exam.id,
        questionNum: qNum,
        isSubjective,
        correctAnswer,
        score,
      };
    });

    await prisma.question.createMany({ data: questions });
    const fullExam = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: { questions: { orderBy: { questionNum: "asc" } } },
    });
    if (fullExam) createdExams.push(fullExam);
  }

  console.log(`Created ${createdExams.length} exams with full questions & answer keys.`);

  // 4. 제출 데이터 샘플 생성 (제출 이력 & 통계 그래프용)
  // 날짜 간격을 과거 3주 전부터 최근까지 분산
  const baseDates = [
    new Date("2026-07-03T10:00:00Z"),
    new Date("2026-07-10T14:30:00Z"),
    new Date("2026-07-17T09:15:00Z"),
  ];

  let totalSubmissionsCount = 0;

  for (const student of students) {
    // 각 학생마다 정답률 시뮬레이션 인자 (김철수: 성적 우상향, 이영희: 상위권, 등)
    let accuracyRate = 0.7; // 기본 70%
    if (student.id === "1101") accuracyRate = 0.75; // 김철수
    else if (student.id === "1102") accuracyRate = 0.90; // 이영희
    else if (student.id === "1201") accuracyRate = 0.65; // 박민수
    else if (student.id === "2101") accuracyRate = 0.82; // 최지우

    for (let examIndex = 0; examIndex < createdExams.length; examIndex++) {
      const exam = createdExams[examIndex];

      // 시험 회차별 날짜 배치
      const roundIndex = examIndex % 3;
      const dateOffset = Math.floor(Math.random() * 86400000); // 1일 이내 랜덤 시간
      const submittedAt = new Date(baseDates[roundIndex].getTime() + dateOffset);

      // 김철수(1101)는 회차가 올라갈수록 성적 향상 시뮬레이션
      let currentAccuracy = accuracyRate;
      if (student.id === "1101") {
        currentAccuracy += roundIndex * 0.1; // 75% -> 85% -> 95%
      } else {
        currentAccuracy += (Math.random() * 0.15 - 0.07); // 약간의 변동
      }
      currentAccuracy = Math.min(Math.max(currentAccuracy, 0.4), 0.98);

      const answers: Record<string, number> = {};
      let totalScore = 0;

      for (const q of exam.questions) {
        const isCorrect = Math.random() < currentAccuracy;
        if (isCorrect) {
          answers[String(q.questionNum)] = q.correctAnswer;
          totalScore += q.score;
        } else {
          if (q.isSubjective) {
            answers[String(q.questionNum)] = (q.correctAnswer + 5) % 100;
          } else {
            answers[String(q.questionNum)] = (q.correctAnswer % 5) + 1;
          }
        }
      }

      await prisma.submission.create({
        data: {
          studentId: student.id,
          examId: exam.id,
          answers,
          totalScore,
          submittedAt,
        },
      });

      totalSubmissionsCount++;
    }
  }

  console.log(`Created ${totalSubmissionsCount} submissions for student and teacher statistics.`);
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
