const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ReportService } = require('../dist/report/report.service.js');

async function main() {
  const companyId = '06dfbf6b-a5a3-492b-becb-a1624e900617'; // BluePeak Construction
  const service = new ReportService(prisma);

  const startDate = new Date('2026-01-01T00:00:00.000Z');
  const endDate = new Date('2026-12-31T23:59:59.000Z');

  const pl = await service.getProfitAndLoss(companyId, startDate, endDate);
  console.log('Profit & Loss for BluePeak (2026):', JSON.stringify(pl, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
