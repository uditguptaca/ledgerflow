import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard, SuperAdminGuard } from '../common/guards';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users across the platform' })
  async getAllUsers() {
    return this.superAdminService.getAllUsers();
  }

  @Post('users/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle user active/suspended status' })
  async toggleUserStatus(@Param('id') id: string) {
    return this.superAdminService.toggleUserStatus(id);
  }

  @Get('companies')
  @ApiOperation({ summary: 'Get all companies across the platform' })
  async getAllCompanies() {
    return this.superAdminService.getAllCompanies();
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete a company from the platform' })
  async deleteCompany(@Param('id') id: string) {
    return this.superAdminService.deleteCompany(id);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all workspace subscriptions' })
  async getAllSubscriptions() {
    return this.superAdminService.getAllSubscriptions();
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Provision a new workspace subscription' })
  async createSubscription(@Body() dto: { workspaceName: string; plan: string }) {
    return this.superAdminService.createSubscription(dto);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update workspace subscription plan tier' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: { plan: string },
  ) {
    return this.superAdminService.updateSubscription(id, dto);
  }
}
