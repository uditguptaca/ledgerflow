import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { UploadDocumentDto, DocumentFilterDto } from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, CurrentUser, RequirePermissions } from '../common/decorators';

@ApiTags('Documents')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @RequirePermissions('documents.upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document and link it optional to an entity' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        entityType: {
          type: 'string',
          description: 'Optional entity type (e.g. INVOICE, BILL, EXPENSE)',
        },
        entityId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional UUID of the linked entity',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.documentService.uploadDocument(
      companyId,
      userId,
      file,
      dto.entityType,
      dto.entityId,
    );
  }

  @Get()
  @RequirePermissions('documents.view')
  @ApiOperation({ summary: 'List all documents, optionally filtered by entity' })
  async getDocuments(
    @CurrentCompany('id') companyId: string,
    @Query() filter: DocumentFilterDto,
  ) {
    return this.documentService.getDocuments(
      companyId,
      filter.entityType,
      filter.entityId,
    );
  }

  @Delete(':id')
  @RequirePermissions('documents.delete')
  @ApiOperation({ summary: 'Delete a document and its file' })
  async deleteDocument(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.documentService.deleteDocument(companyId, id);
  }
}
