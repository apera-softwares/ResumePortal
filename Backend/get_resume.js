const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const candidate = await prisma.candidate.findUnique({
    where: { id: '84a09a55-25bd-4ce0-b3a8-25c2acb18816' }
  });
  if (candidate && candidate.resumeText) {
    fs.writeFileSync('cherry_resume.html', candidate.resumeText);
    console.log('Successfully wrote cherry_resume.html');
  } else {
    console.log('Candidate or resumeText not found');
  }
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
