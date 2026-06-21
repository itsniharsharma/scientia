/**
 * Idempotent migration: for each teacher who has tests without a batchId,
 * find-or-create a "Default Batch" for that teacher and assign those tests to it.
 *
 * Run with: npx tsx scripts/migrate-to-batches.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, username: true },
  });

  let totalAssigned = 0;

  for (const teacher of teachers) {
    const unbatchedTests = await prisma.test.findMany({
      where: { teacherId: teacher.id, batchId: null },
      select: { id: true },
    });

    if (unbatchedTests.length === 0) {
      console.log(`Teacher ${teacher.username}: no unbatched tests — skipping`);
      continue;
    }

    // Find-or-create the default batch
    let defaultBatch = await prisma.batch.findFirst({
      where: { teacherId: teacher.id, name: 'Default Batch' },
    });

    if (!defaultBatch) {
      defaultBatch = await prisma.batch.create({
        data: { name: 'Default Batch', teacherId: teacher.id },
      });
      console.log(`Teacher ${teacher.username}: created Default Batch (${defaultBatch.id})`);
    } else {
      console.log(`Teacher ${teacher.username}: using existing Default Batch (${defaultBatch.id})`);
    }

    // Assign all unbatched tests to the default batch
    const { count } = await prisma.test.updateMany({
      where: { id: { in: unbatchedTests.map((t) => t.id) } },
      data: { batchId: defaultBatch.id },
    });

    console.log(`Teacher ${teacher.username}: assigned ${count} test(s) to Default Batch`);
    totalAssigned += count;
  }

  console.log(`\nDone. Total tests assigned to a batch: ${totalAssigned}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
