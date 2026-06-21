import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto, GetVendorsFilterDto } from './vendor.dto';
import Decimal from 'decimal.js';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendors(companyId: string, filters?: GetVendorsFilterDto) {
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

    return this.prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getVendor(companyId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID '${id}' not found`);
    }

    return vendor;
  }

  async createVendor(companyId: string, dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        taxId: dto.taxId,
        address: dto.address ?? null,
        defaultTerms: dto.defaultTerms ?? 30,
        notes: dto.notes,
        isActive: true,
      },
    });
  }

  async updateVendor(companyId: string, id: string, dto: UpdateVendorDto) {
    const vendor = await this.getVendor(companyId, id);

    return this.prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.defaultTerms !== undefined && { defaultTerms: dto.defaultTerms }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async getVendorBalance(companyId: string, id: string): Promise<Decimal> {
    await this.getVendor(companyId, id);

    const apAccount = await this.prisma.account.findFirst({
      where: { companyId, systemTag: 'AP', isActive: true },
    });

    if (!apAccount) {
      return new Decimal(0);
    }

    const aggregation = await this.prisma.journalLine.aggregate({
      where: {
        vendorId: id,
        accountId: apAccount.id,
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

    // Accounts Payable is credit-normal liability account
    return totalCredit.minus(totalDebit);
  }
}
