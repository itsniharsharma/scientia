import { PrismaClient } from '@prisma/client';
import { SUBJECTS } from './subjects';
import { CHAPTERS } from './chapters';

const prisma = new PrismaClient();

async function seedOrganization() {
  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Scientia Default',
      slug: 'default',
      plan: 'standard',
      isActive: true,
    },
  });
  console.log(`✓ Organization: ${org.name}`);
  return org;
}

async function seedSubjects() {
  const results = [];
  for (const subject of SUBJECTS) {
    const result = await prisma.subject.upsert({
      where: { code: subject.code },
      update: { name: subject.name, displayOrder: subject.displayOrder },
      create: subject,
    });
    results.push(result);
  }
  console.log(`✓ Subjects: ${results.length} upserted`);
  return results;
}

async function seedChapters(subjects: Array<{ id: string; code: string }>) {
  const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));
  let count = 0;

  for (const chapter of CHAPTERS) {
    const subjectId = subjectMap.get(chapter.subjectCode);
    if (!subjectId) {
      console.warn(`  ⚠ No subject found for code: ${chapter.subjectCode}`);
      continue;
    }

    await prisma.chapter.upsert({
      where: {
        subjectId_number_syllabusTag: {
          subjectId,
          number: chapter.number,
          syllabusTag: chapter.syllabusTag,
        },
      },
      update: { name: chapter.name },
      create: {
        subjectId,
        name: chapter.name,
        number: chapter.number,
        syllabusTag: chapter.syllabusTag,
      },
    });
    count++;
  }
  console.log(`✓ Chapters: ${count} upserted`);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  await seedOrganization();
  const subjects = await seedSubjects();
  await seedChapters(subjects);

  console.log('\n✅ Seed complete.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
