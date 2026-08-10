const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const exams = await prisma.exam.findMany({ include: { questions: true } });
  for (const e of exams) {
    const maxScore = e.questions.reduce((a, b) => a + b.score, 0);
    console.log(`Exam: ${e.title}, Subject: ${e.subject}, MaxScore: ${maxScore}`);
  }
}
main().finally(() => prisma.$disconnect());
