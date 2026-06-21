import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './audit.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Audit logs')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('audit.view')
  @Get()
  @ApiOperation({ summary: 'Retrieve audit logs for the company with pagination and filters' })
  async getAuditLogs(
    @CurrentCompany('id') companyId: string,
    @Query() query: AuditQueryDto,
  ) {
    return this.auditService.findAll({
      ...query,
      companyId, // Force audit query to be scoped to current company context
    });
  }
}
