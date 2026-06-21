import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import { StartReconciliationDto } from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, CurrentUser, RequirePermissions } from '../common/decorators';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Reconciliation')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Start a new reconciliation session' })
  async startReconciliation(
    @CurrentCompany('id') companyId: string,
    @Body() dto: StartReconciliationDto,
  ) {
    return this.reconciliationService.startReconciliation(companyId, dto);
  }

  @Get(':sessionId')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Get a reconciliation session details' })
  async getReconciliation(
    @CurrentCompany('id') companyId: string,
    @Param('sessionId') sessionId: string,
  ) {
    // Verify session belongs to a bank account in this company
    const session = await this.prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
      include: { bankAccount: true },
    });

    if (!session || session.bankAccount.companyId !== companyId) {
      throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
    }

    return this.reconciliationService.getReconciliation(sessionId);
  }

  @Post(':sessionId/toggle/:transactionId')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Toggle cleared status of a transaction line' })
  async toggleCleared(
    @CurrentCompany('id') companyId: string,
    @Param('sessionId') sessionId: string,
    @Param('transactionId') transactionId: string,
  ) {
    // Verify session belongs to a bank account in this company
    const session = await this.prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
      include: { bankAccount: true },
    });

    if (!session || session.bankAccount.companyId !== companyId) {
      throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
    }

    return this.reconciliationService.toggleCleared(sessionId, transactionId);
  }

  @Post(':sessionId/complete')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Complete a reconciliation session' })
  async completeReconciliation(
    @CurrentCompany('id') companyId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify session belongs to a bank account in this company
    const session = await this.prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
      include: { bankAccount: true },
    });

    if (!session || session.bankAccount.companyId !== companyId) {
      throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
    }

    return this.reconciliationService.completeReconciliation(sessionId, userId);
  }

  @Get('history/:bankAccountId')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Get completed reconciliation history for a bank account' })
  async getReconciliationHistory(
    @CurrentCompany('id') companyId: string,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    // Verify bank account belongs to this company
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });

    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${bankAccountId} not found`);
    }

    return this.reconciliationService.getReconciliationHistory(bankAccountId);
  }
}
