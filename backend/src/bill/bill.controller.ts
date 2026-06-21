import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { CreateBillDto, UpdateBillDto, BillFilterDto } from './bill.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Bills')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-company-id',
  description: 'The active company ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post()
  @RequirePermissions('bills.create')
  @ApiOperation({ summary: 'Create a new bill in DRAFT status' })
  @ApiResponse({ status: 201, description: 'Bill draft successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error.' })
  @ApiResponse({ status: 404, description: 'Vendor or account not found.' })
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBillDto,
  ) {
    return this.billService.createBill(companyId, userId, dto);
  }

  @Get()
  @RequirePermissions('bills.view')
  @ApiOperation({ summary: 'Retrieve a paginated list of bills with optional filters' })
  @ApiResponse({ status: 200, description: 'List of bills successfully retrieved.' })
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() filters: BillFilterDto,
  ) {
    return this.billService.getBills(companyId, filters);
  }

  @Get(':id')
  @RequirePermissions('bills.view')
  @ApiOperation({ summary: 'Retrieve a single bill with all details' })
  @ApiResponse({ status: 200, description: 'Bill successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.billService.getBill(companyId, id);
  }

  @Patch(':id')
  @RequirePermissions('bills.edit')
  @ApiOperation({ summary: 'Update a draft bill' })
  @ApiResponse({ status: 200, description: 'Bill successfully updated.' })
  @ApiResponse({ status: 400, description: 'Only DRAFT bills can be updated.' })
  @ApiResponse({ status: 404, description: 'Bill, vendor, or account not found.' })
  async update(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.billService.updateBill(companyId, id, userId, dto);
  }

  @Post(':id/post')
  @RequirePermissions('bills.approve')
  @ApiOperation({ summary: 'Post a draft bill and create its double-entry journal entry' })
  @ApiResponse({ status: 200, description: 'Bill successfully posted.' })
  @ApiResponse({ status: 400, description: 'Only DRAFT bills can be posted.' })
  @ApiResponse({ status: 404, description: 'Bill or system account not found.' })
  async postBill(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billService.postBill(companyId, id, userId);
  }

  @Post(':id/void')
  @RequirePermissions('bills.void')
  @ApiOperation({ summary: 'Void a posted bill and reverse its journal entry' })
  @ApiResponse({ status: 200, description: 'Bill successfully voided.' })
  @ApiResponse({ status: 400, description: 'Only PENDING or OVERDUE bills can be voided.' })
  @ApiResponse({ status: 409, description: 'Cannot void bill with allocated payments.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  async voidBill(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billService.voidBill(companyId, id, userId);
  }
}
