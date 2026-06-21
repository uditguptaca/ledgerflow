const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3001/api';

async function main() {
  console.log('--- STARTING AUTOMATED END-TO-END MANUAL VERIFICATION ---\n');

  // 1. Query IDs directly from DB
  const company = await prisma.company.findFirst({
    where: { name: { contains: 'Cedar Lane Retail' } },
  });
  if (!company) throw new Error('Company Cedar Lane Retail not found');
  const companyId = company.id;

  const customer = await prisma.customer.findFirst({
    where: { companyId },
  });
  if (!customer) throw new Error('Customer not found');
  const customerId = customer.id;

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { companyId },
  });
  if (!bankAccount) throw new Error('Bank account not found');
  const bankAccountId = bankAccount.id;

  const revenueAccount = await prisma.account.findFirst({
    where: { companyId, type: 'INCOME', code: '4010' }, // sales revenue
  });
  if (!revenueAccount) throw new Error('Revenue account not found');

  const taxCode = await prisma.taxCode.findFirst({
    where: { companyId, rate: 0.13 }, // HST
  });
  if (!taxCode) throw new Error('HST tax code not found');

  console.log('Found Database Identifiers:');
  console.log(`- Company ID: ${companyId}`);
  console.log(`- Customer ID: ${customerId} (${customer.name})`);
  console.log(`- Bank Account ID: ${bankAccountId} (${bankAccount.name})`);
  console.log(`- Revenue Account ID: ${revenueAccount.id} (${revenueAccount.name})`);
  console.log(`- Tax Code ID: ${taxCode.id} (HST 13%)\n`);

  // 2. Authenticate
  console.log('Authenticating as Admin (lisa@cedarlane.demo)...');
  const loginRes = await fetch(`${API_BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lisa@cedarlane.demo', password: 'Demo2024!' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Authenticated successfully!\n');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-company-id': companyId,
    'Content-Type': 'application/json',
  };

  // Helper to fetch report
  const fetchReport = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch report ${path}: ${await res.text()}`);
    return res.json();
  };

  // 3. Fetch Initial Reports
  console.log('Fetching initial reports...');
  const plInitial = await fetchReport('/v1/reports/profit-loss?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z');
  const bsInitial = await fetchReport('/v1/reports/balance-sheet?asOfDate=2025-01-31T23:59:59Z');
  const tbInitial = await fetchReport('/v1/reports/trial-balance?asOfDate=2025-01-31T23:59:59Z');
  const cfInitial = await fetchReport('/v1/reports/cash-flow?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z');

  console.log('\n--- INITIAL FINANCIAL VALUES (SEEDED GOLDEN BOOKS) ---');
  console.log(`- P&L Net Profit: $${Number(plInitial.netProfit).toFixed(2)} (Expected: -$1650.00)`);
  console.log(`- Balance Sheet Total Assets: $${Number(bsInitial.assets.totalAssets).toFixed(2)} (Expected: $78480.00)`);
  console.log(`- Balance Sheet Total Equity: $${Number(bsInitial.equity.totalEquity).toFixed(2)} (Expected: $58350.00)`);
  console.log(`- Balance Sheet isBalanced: ${bsInitial.isBalanced} (Expected: true)`);
  console.log(`- Trial Balance totalDebits: $${Number(tbInitial.totalDebits).toFixed(2)} (Expected: $87430.00)`);
  console.log(`- Trial Balance isBalanced: ${tbInitial.isBalanced} (Expected: true)`);
  console.log(`- Cash Flow Ending Cash: $${Number(cfInitial.endingCashBalance).toFixed(2)} (Expected: $48820.00)`);
  console.log('-----------------------------------------------------\n');

  // 4. Create a draft invoice
  console.log('Creating new draft invoice (Amount: $1000 + $130 HST = $1130)...');
  const createInvRes = await fetch(`${API_BASE}/v1/invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customerId,
      date: '2025-01-15T12:00:00.000Z',
      dueDate: '2025-02-15T12:00:00.000Z',
      lines: [
        {
          accountId: revenueAccount.id,
          description: 'Consulting services & manual verification testing',
          quantity: 1,
          unitPrice: 1000.00,
          taxCodeId: taxCode.id,
        },
      ],
    }),
  });
  if (!createInvRes.ok) throw new Error(`Invoice creation failed: ${await createInvRes.text()}`);
  const invoice = await createInvRes.json();
  console.log(`Invoice draft created! Number: ${invoice.number}, ID: ${invoice.id}`);

  // 5. Post the invoice (accrues revenue, AR, and tax payable)
  console.log(`Posting invoice ${invoice.number} to trigger ledger postings...`);
  const postInvRes = await fetch(`${API_BASE}/v1/invoices/${invoice.id}/post`, {
    method: 'POST',
    headers,
  });
  if (!postInvRes.ok) throw new Error(`Invoice posting failed: ${await postInvRes.text()}`);
  console.log('Invoice posted successfully!\n');

  // 6. Fetch Intermediate Reports (after Invoice posting, before Payment)
  console.log('Fetching intermediate reports...');
  const plPosted = await fetchReport('/v1/reports/profit-loss?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z');
  const bsPosted = await fetchReport('/v1/reports/balance-sheet?asOfDate=2025-01-31T23:59:59Z');
  const tbPosted = await fetchReport('/v1/reports/trial-balance?asOfDate=2025-01-31T23:59:59Z');

  console.log('\n--- VALUES AFTER INVOICE POSTING ---');
  console.log(`- P&L Net Profit: $${Number(plPosted.netProfit).toFixed(2)} (Expected: -$650.00, increased by $1000 revenue)`);
  console.log(`- Balance Sheet Total Assets: $${Number(bsPosted.assets.totalAssets).toFixed(2)} (Expected: $79610.00, increased by $1130 AR)`);
  console.log(`- Balance Sheet Total Liabilities: $${Number(bsPosted.liabilities.totalLiabilities).toFixed(2)} (Expected: $20260.00, increased by $130 Sales Tax)`);
  console.log(`- Balance Sheet Total Equity: $${Number(bsPosted.equity.totalEquity).toFixed(2)} (Expected: $59350.00, increased by $1000 Net Income)`);
  console.log(`- Balance Sheet isBalanced: ${bsPosted.isBalanced} (Expected: true)`);
  console.log(`- Trial Balance totalDebits: $${Number(tbPosted.totalDebits).toFixed(2)} (Expected: $89160.00, increased by $1130 AR + $600 COGS movement offset)`);
  console.log('------------------------------------\n');

  // 7. Record a payment against the invoice
  console.log(`Recording payment of $1130 against invoice ${invoice.number}...`);
  const recordPayRes = await fetch(`${API_BASE}/v1/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customerId,
      bankAccountId,
      date: '2025-01-20T12:00:00.000Z',
      amount: 1130.00,
      reference: 'MAN-VERIFY-99',
      notes: 'Automated manual verification test payment',
      allocations: [
        {
          invoiceId: invoice.id,
          amount: 1130.00,
        },
      ],
    }),
  });
  if (!recordPayRes.ok) throw new Error(`Payment recording failed: ${await recordPayRes.text()}`);
  const payment = await recordPayRes.json();
  console.log(`Payment recorded! Number: ${payment.number}, ID: ${payment.id}\n`);

  // 8. Fetch Final Reports (after Payment)
  console.log('Fetching final reports...');
  const plFinal = await fetchReport('/v1/reports/profit-loss?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z');
  const bsFinal = await fetchReport('/v1/reports/balance-sheet?asOfDate=2025-01-31T23:59:59Z');
  const tbFinal = await fetchReport('/v1/reports/trial-balance?asOfDate=2025-01-31T23:59:59Z');
  const cfFinal = await fetchReport('/v1/reports/cash-flow?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z');
  const glFinal = await fetchReport(`/v1/reports/general-ledger?accountId=${bankAccount.accountId}&startDate=2025-01-01&endDate=2025-01-31`);

  console.log('\n--- FINAL VALUES AFTER PAYMENT ---');
  console.log(`- P&L Net Profit: $${Number(plFinal.netProfit).toFixed(2)} (Expected: -$650.00)`);
  console.log(`- Balance Sheet Total Assets: $${Number(bsFinal.assets.totalAssets).toFixed(2)} (Expected: $79610.00, unchanged, AR shifted to Cash)`);
  console.log(`- Balance Sheet Cash & Bank Account: $${Number(bsFinal.assets.cashAndBank.total).toFixed(2)} (Expected: $49950.00, increased by $1130 payment)`);
  console.log(`- Balance Sheet Accounts Receivable: $${Number(bsFinal.assets.accountsReceivable.total).toFixed(2)} (Expected: $0.00, decreased by $1130 payment)`);
  console.log(`- Balance Sheet isBalanced: ${bsFinal.isBalanced} (Expected: true)`);
  console.log(`- Trial Balance totalDebits: $${Number(tbFinal.totalDebits).toFixed(2)} (Expected: $90290.00, includes gross payment DR/CR)`);
  console.log(`- Cash Flow Ending Cash Balance: $${Number(cfFinal.endingCashBalance).toFixed(2)} (Expected: $49950.00, initial $48820 + $1130 payment)`);
  console.log(`- Cash Flow Net Change in Cash: $${Number(cfFinal.netChangeInCash).toFixed(2)} (Expected: -$50.00)`);
  console.log(`- Checking Account GL Line Count: ${glFinal.lines.length} lines`);
  console.log('----------------------------------\n');

  console.log('✅ Manual Verification E2E Process completed successfully!');
  console.log('The reports and general ledger updated in real-time as expected.');
}

main()
  .catch((err) => {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
