import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaxCodeDto, UpdateTaxCodeDto } from './tax.dto';
import Decimal from 'decimal.js';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaxCodes(companyId: string) {
    return this.prisma.taxCode.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
  }

  async createTaxCode(companyId: string, dto: CreateTaxCodeDto) {
    const existing = await this.prisma.taxCode.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Tax code '${dto.code}' already exists for this company`);
    }

    return this.prisma.taxCode.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code,
        rate: new Decimal(dto.rate),
        type: dto.type,
        description: dto.description,
        isActive: true,
      },
    });
  }

  async updateTaxCode(companyId: string, id: string, dto: UpdateTaxCodeDto) {
    const taxCode = await this.prisma.taxCode.findFirst({
      where: { id, companyId },
    });

    if (!taxCode) {
      throw new NotFoundException(`Tax code with ID '${id}' not found`);
    }

    return this.prisma.taxCode.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.rate !== undefined && { rate: new Decimal(dto.rate) }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  calculateTax(amount: string | number | Decimal, rate: string | number | Decimal, isInclusive: boolean) {
    const amtDec = new Decimal(amount.toString());
    const rateDec = new Decimal(rate.toString());

    if (isInclusive) {
      // taxAmount = amount - (amount / (1 + rate))
      const divisor = new Decimal(1).plus(rateDec);
      const netAmount = amtDec.div(divisor);
      const taxAmount = amtDec.minus(netAmount);
      return {
        netAmount,
        taxAmount,
        totalAmount: amtDec,
      };
    } else {
      // taxAmount = amount * rate
      const taxAmount = amtDec.times(rateDec);
      const totalAmount = amtDec.plus(taxAmount);
      return {
        netAmount: amtDec,
        taxAmount,
        totalAmount,
      };
    }
  }
}
