const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log('Companies:');
  for (const c of companies) {
    const entryCount = await prisma.journalEntry.count({ where: { companyId: c.id } });
    const firstEntry = await prisma.journalEntry.findFirst({ where: { companyId: c.id }, orderBy: { date: 'asc' } });
    const lastEntry = await prisma.journalEntry.findFirst({ where: { companyId: c.id }, orderBy: { date: 'desc' } });
    console.log(`- ID: ${c.id}`);
    console.log(`  Name: ${c.name}`);
    console.log(`  Journal Entries Count: ${entryCount}`);
    if (firstEntry) {
      console.log(`  First Entry: ${firstEntry.date.toISOString()} (${firstEntry.number})`);
      console.log(`  Last Entry: ${lastEntry.date.toISOString()} (${lastEntry.number})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
