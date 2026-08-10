const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const exams = await prisma.exam.findMany({ include: { questions: true } });
  console.log(JSON.stringify(exams.map(e => ({ title: e.title, subject: e.subject, maxScore: e.questions.reduce((a,b)=>a+b.score, 0), qCount: e.questions.length })), null, 2));
}
main().finally(() => prisma.$disconnect());
