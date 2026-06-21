const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany();
  console.log('Customers in database:');
  customers.forEach(c => {
    console.log(`- ID: ${c.id}, Name: ${c.name}, CompanyId: ${c.companyId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
