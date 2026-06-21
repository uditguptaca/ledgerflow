import { Prisma } from '@prisma/client';

export async function generateUniqueNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
  type: 'JOURNAL' | 'INVOICE' | 'BILL' | 'PAYMENT' | 'EXPENSE' | 'VENDOR_PAYMENT',
  padLength: number = 4
): Promise<string> {
  const company = await tx.company.findUnique({
    where: { id: companyId },
  });
  if (!company) throw new Error('Company not found');

  let nextNumField: keyof typeof company;
  let prefix: string;

  switch (type) {
    case 'JOURNAL':
      nextNumField = 'nextJournalNum';
      prefix = company.journalPrefix || 'JE';
      break;
    case 'INVOICE':
      nextNumField = 'nextInvoiceNum';
      prefix = company.invoicePrefix || 'INV';
      break;
    case 'BILL':
      nextNumField = 'nextBillNum';
      prefix = company.billPrefix || 'BILL';
      break;
    case 'PAYMENT':
      nextNumField = 'nextPaymentNum';
      prefix = company.paymentPrefix || 'PAY';
      break;
    case 'VENDOR_PAYMENT':
      nextNumField = 'nextPaymentNum';
      prefix = 'VPAY';
      break;
    case 'EXPENSE':
      nextNumField = 'nextExpenseNum';
      prefix = 'EXP';
      break;
  }

  let nextNum = company[nextNumField] as number;
  let exists = true;
  let generatedNumber = '';

  while (exists) {
    generatedNumber = `${prefix}-${String(nextNum).padStart(padLength, '0')}`;
    
    let record = null;
    switch (type) {
      case 'JOURNAL':
        record = await tx.journalEntry.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
      case 'INVOICE':
        record = await tx.invoice.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
      case 'BILL':
        record = await tx.bill.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
      case 'PAYMENT':
        record = await tx.payment.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
      case 'VENDOR_PAYMENT':
        record = await tx.vendorPayment.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
      case 'EXPENSE':
        record = await tx.expense.findUnique({
          where: { companyId_number: { companyId, number: generatedNumber } }
        });
        break;
    }

    if (record) {
      nextNum++;
    } else {
      exists = false;
    }
  }

  // Update nextNum on the company
  await tx.company.update({
    where: { id: companyId },
    data: { [nextNumField]: nextNum + 1 }
  });

  return generatedNumber;
}
