const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidate = await prisma.candidate.findUnique({
    where: { id: '84a09a55-25bd-4ce0-b3a8-25c2acb18816' }
  });
  console.log('Candidate ID:', candidate.id);
  console.log('Resume Filename:', candidate.resume);
  console.log('Has resumeText:', !!candidate.resumeText);
  console.log('resumeText length:', candidate.resumeText?.length);
  console.log('Has editedHtml:', !!candidate.editedHtml);
  console.log('editedHtml length:', candidate.editedHtml?.length);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
