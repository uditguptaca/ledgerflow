// Frontend Mock Data Fallback for Sandbox / Demo Environments

export const mockUsers = {
  'sarah@northstar.demo': {
    id: 'sarah-id',
    email: 'sarah@northstar.demo',
    firstName: 'Sarah',
    lastName: 'Chen',
    name: 'Sarah Chen',
    role: 'Owner',
    avatarUrl: '',
    emailVerified: true,
  },
  'lisa@cedarlane.demo': {
    id: 'lisa-id',
    email: 'lisa@cedarlane.demo',
    firstName: 'Lisa',
    lastName: 'Park',
    name: 'Lisa Park',
    role: 'Admin',
    avatarUrl: '',
    emailVerified: true,
  },
  'admin@ledgerflow.dev': {
    id: 'admin-id',
    email: 'admin@ledgerflow.dev',
    firstName: 'Platform',
    lastName: 'SuperAdmin',
    name: 'Platform SuperAdmin',
    role: 'SUPER_ADMIN',
    avatarUrl: '',
    emailVerified: true,
  },
};

export const mockCompanies = [
  { id: 'co-1', name: 'BluePeak Construction', currency: 'USD', role: 'Owner' },
  { id: 'co-2', name: 'Cedar Lane Retail', currency: 'USD', role: 'Admin' },
  { id: 'co-3', name: 'Nova Health Services', currency: 'USD', role: 'Auditor' },
];

export const mockAccounts = [
  { id: 'acct-1', code: '1010', name: 'Checking Account', type: 'ASSET', subType: 'CASH', balance: 154039.0 },
  { id: 'acct-2', code: '1200', name: 'Accounts Receivable', type: 'ASSET', subType: 'RECEIVABLE', balance: 25000.0 },
  { id: 'acct-3', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'PAYABLE', balance: 12500.0 },
  { id: 'acct-4', code: '3000', name: 'Owner Equity', type: 'EQUITY', subType: 'EQUITY', balance: 100000.0 },
  { id: 'acct-5', code: '4000', name: 'Sales Revenue', type: 'INCOME', subType: 'REVENUE', balance: 87500.0 },
  { id: 'acct-6', code: '6000', name: 'Rent Expense', type: 'EXPENSE', subType: 'EXPENSE', balance: 20000.0 },
];

export const mockCustomers = [
  { id: 'cust-1', name: 'Acme Corporation', email: 'finance@acme.com', phone: '555-0199', balance: 15000.0 },
  { id: 'cust-2', name: 'Stark Industries', email: 'invoice@stark.com', phone: '555-0210', balance: 10000.0 },
];

export const mockVendors = [
  { id: 'vend-1', name: 'Fresh Supply Co', email: 'orders@freshsupply.com', phone: '555-0188', balance: 8000.0 },
  { id: 'vend-2', name: 'Apex Hostings', email: 'billing@apexhost.com', phone: '555-0155', balance: 4500.0 },
];

export const mockInvoices = [
  {
    id: 'inv-1',
    number: 'INV-2025-001',
    customer: { name: 'Acme Corporation' },
    customerId: 'cust-1',
    date: '2025-01-15T00:00:00Z',
    dueDate: '2025-02-15T00:00:00Z',
    subtotal: 13636.36,
    taxTotal: 1363.64,
    total: 15000.0,
    amountPaid: 0,
    amountDue: 15000.0,
    status: 'UNPAID',
    lines: [
      { id: 'l1', description: 'Consulting & Engineering Services', quantity: 1, unitPrice: 13636.36, taxAmount: 1363.64, lineTotal: 13636.36, accountId: 'acct-5' }
    ]
  },
  {
    id: 'inv-2',
    number: 'INV-2025-002',
    customer: { name: 'Stark Industries' },
    customerId: 'cust-2',
    date: '2025-01-18T00:00:00Z',
    dueDate: '2025-02-18T00:00:00Z',
    subtotal: 9090.91,
    taxTotal: 909.09,
    total: 10000.0,
    amountPaid: 10000.0,
    amountDue: 0,
    status: 'PAID',
    lines: [
      { id: 'l2', description: 'Custom Component Fabrication', quantity: 1, unitPrice: 9090.91, taxAmount: 909.09, lineTotal: 9090.91, accountId: 'acct-5' }
    ]
  }
];

export const mockBills = [
  {
    id: 'bill-1',
    number: 'BILL-2025-001',
    vendor: { name: 'Fresh Supply Co' },
    vendorId: 'vend-1',
    date: '2025-01-10T00:00:00Z',
    dueDate: '2025-02-10T00:00:00Z',
    subtotal: 7272.73,
    taxTotal: 727.27,
    total: 8000.0,
    amountPaid: 0,
    amountDue: 8000.0,
    status: 'UNPAID',
    lines: [
      { id: 'bl1', description: 'Office Inventory Supplies', quantity: 1, unitPrice: 7272.73, taxAmount: 727.27, lineTotal: 7272.73, accountId: 'acct-6' }
    ]
  }
];

export const mockJournals = [
  {
    id: 'j-1',
    number: 'JE-0001',
    date: '2025-01-01T00:00:00Z',
    memo: 'Opening Balance Equity Alignment',
    sourceType: 'MANUAL',
    lines: [
      { id: 'jl-1', account: { code: '1010', name: 'Checking Account' }, debit: 100000.0, credit: 0 },
      { id: 'jl-2', account: { code: '3300', name: 'Opening Balance Equity' }, debit: 0, credit: 100000.0 }
    ]
  }
];

export const handleMockRequest = (method: string, url: string, body?: any): any => {
  console.log(`[Mock API Proxy] Intercepted: ${method} ${url}`, body);
  const cleanUrl = url.split('?')[0];

  // Auth Mocks
  if (cleanUrl === '/v1/auth/login') {
    const { email } = body || {};
    if (mockUsers[email as keyof typeof mockUsers]) {
      return { accessToken: `mock-token-${email}`, refreshToken: 'mock-refresh-token' };
    }
    throw new Error('Invalid email or password (Mock Mode).');
  }

  if (cleanUrl === '/v1/auth/me') {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ledgerflow_token') : null;
    if (token && token.startsWith('mock-token-')) {
      const email = token.replace('mock-token-', '');
      if (mockUsers[email as keyof typeof mockUsers]) {
        return mockUsers[email as keyof typeof mockUsers];
      }
    }
    return mockUsers['sarah@northstar.demo']; // Default fallback profile
  }

  // Company Mocks
  if (cleanUrl === '/v1/companies') {
    return mockCompanies;
  }

  // Account Mocks
  if (cleanUrl === '/v1/accounting/accounts') {
    return mockAccounts;
  }

  // Customer / Vendor Mocks
  if (cleanUrl === '/v1/customers') {
    return mockCustomers;
  }

  if (cleanUrl === '/v1/vendors') {
    return mockVendors;
  }

  // Invoice / Bill Mocks
  if (cleanUrl === '/v1/invoices') {
    if (method === 'POST') {
      const newInv = {
        id: `inv-${Date.now()}`,
        number: `INV-2025-${String(mockInvoices.length + 1).padStart(3, '0')}`,
        customer: { name: mockCustomers.find(c => c.id === body.customerId)?.name || 'New Customer' },
        customerId: body.customerId,
        date: body.date || new Date().toISOString(),
        dueDate: body.dueDate || new Date().toISOString(),
        subtotal: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        taxTotal: 0,
        total: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        amountPaid: 0,
        amountDue: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        status: 'UNPAID',
        lines: body.lines || []
      };
      mockInvoices.unshift(newInv);
      return newInv;
    }
    return { data: mockInvoices, total: mockInvoices.length };
  }

  if (cleanUrl === '/v1/bills') {
    if (method === 'POST') {
      const newBill = {
        id: `bill-${Date.now()}`,
        number: `BILL-2025-${String(mockBills.length + 1).padStart(3, '0')}`,
        vendor: { name: mockVendors.find(v => v.id === body.vendorId)?.name || 'New Vendor' },
        vendorId: body.vendorId,
        date: body.date || new Date().toISOString(),
        dueDate: body.dueDate || new Date().toISOString(),
        subtotal: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        taxTotal: 0,
        total: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        amountPaid: 0,
        amountDue: body.lines?.reduce((s: number, l: any) => s + (l.unitPrice * l.quantity), 0) || 0,
        status: 'UNPAID',
        lines: body.lines || []
      };
      mockBills.unshift(newBill);
      return newBill;
    }
    return { data: mockBills, total: mockBills.length };
  }

  // Journal Mocks
  if (cleanUrl === '/v1/accounting/journals') {
    return { data: mockJournals, total: mockJournals.length };
  }

  // Reports Mocks
  if (cleanUrl === '/v1/reports/profit-loss') {
    return {
      netProfit: 67500.0,
      income: {
        totalIncome: 87500.0,
        lines: [{ name: 'Sales Revenue', balance: 87500.0 }]
      },
      operatingExpenses: {
        totalOperatingExpenses: 20000.0,
        lines: [{ name: 'Rent Expense', balance: 20000.0 }]
      }
    };
  }

  if (cleanUrl === '/v1/reports/balance-sheet') {
    return {
      assets: {
        total: 179039.0,
        cashAndBank: { total: 154039.0 },
        accountsReceivable: { total: 25000.0 }
      },
      liabilities: {
        total: 12500.0,
        accountsPayable: { total: 12500.0 }
      },
      equity: {
        total: 166539.0,
        retainedEarnings: { total: 67500.0 },
        openingBalance: { total: 100000.0 }
      }
    };
  }

  if (cleanUrl === '/v1/banking/accounts') {
    return [
      { id: 'bank-1', name: 'Silicon Valley Bank (Checking)', accountNumber: '••••4421', currentBalance: '154039.00' }
    ];
  }

  // Default empty resolver
  return [];
};
