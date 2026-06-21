import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomersFilterDto } from './customer.dto';
import Decimal from 'decimal.js';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(companyId: string, filters?: GetCustomersFilterDto) {
    const where: any = { companyId };

    if (filters?.isActive !== undefined) {
      where.isActive = String(filters.isActive) === 'true' || filters.isActive === true;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getCustomer(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    return customer;
  }

  async createCustomer(companyId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        taxId: dto.taxId,
        billingAddress: dto.billingAddress ?? null,
        shippingAddress: dto.shippingAddress ?? null,
        defaultTerms: dto.defaultTerms ?? 30,
        creditLimit: dto.creditLimit ? new Decimal(dto.creditLimit) : null,
        notes: dto.notes,
        isActive: true,
      },
    });
  }

  async updateCustomer(companyId: string, id: string, dto: UpdateCustomerDto) {
    const customer = await this.getCustomer(companyId, id);

    return this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.billingAddress !== undefined && { billingAddress: dto.billingAddress }),
        ...(dto.shippingAddress !== undefined && { shippingAddress: dto.shippingAddress }),
        ...(dto.defaultTerms !== undefined && { defaultTerms: dto.defaultTerms }),
        ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit ? new Decimal(dto.creditLimit) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async getCustomerBalance(companyId: string, id: string): Promise<Decimal> {
    await this.getCustomer(companyId, id);

    const arAccount = await this.prisma.account.findFirst({
      where: { companyId, systemTag: 'AR', isActive: true },
    });

    if (!arAccount) {
      return new Decimal(0);
    }

    const aggregation = await this.prisma.journalLine.aggregate({
      where: {
        customerId: id,
        accountId: arAccount.id,
        journalEntry: {
          companyId,
          isPosted: true,
          isVoided: false,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const totalDebit = new Decimal(aggregation._sum.debit?.toString() ?? '0');
    const totalCredit = new Decimal(aggregation._sum.credit?.toString() ?? '0');

    // Accounts Receivable is a debit-normal asset account
    return totalDebit.minus(totalCredit);
  }

  async deleteCustomer(companyId: string, id: string) {
    const customer = await this.getCustomer(companyId, id);

    // Check if the customer has any invoices
    const invoiceCount = await this.prisma.invoice.count({
      where: { customerId: id },
    });
    if (invoiceCount > 0) {
      throw new BadRequestException('Cannot delete customer with existing invoices. Mark them inactive instead.');
    }

    // Check if the customer has any journal lines
    const journalLineCount = await this.prisma.journalLine.count({
      where: { customerId: id },
    });
    if (journalLineCount > 0) {
      throw new BadRequestException('Cannot delete customer with existing transaction history. Mark them inactive instead.');
    }

    await this.prisma.customer.delete({
      where: { id: customer.id },
    });

    return { success: true };
  }
}
