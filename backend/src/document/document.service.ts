import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    // For MVP, store files on local disk under /uploads
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a document. Stores file on disk and creates a DB record.
   * @param file - Multer file object
   */
  async uploadDocument(
    companyId: string,
    userId: string,
    file: Express.Multer.File,
    entityType?: string,
    entityId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Generate a unique S3-style key (for future migration to actual S3)
    const ext = path.extname(file.originalname);
    const s3Key = `${companyId}/${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, s3Key);

    // Ensure company subdirectory exists
    const companyDir = path.join(this.uploadDir, companyId);
    if (!fs.existsSync(companyDir)) {
      fs.mkdirSync(companyDir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        companyId,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        s3Key,
        entityType: entityType || null,
        entityId: entityId || null,
        uploadedBy: userId,
      },
    });

    this.logger.log(`Document uploaded: ${file.originalname} (${file.size} bytes) -> ${s3Key}`);

    return document;
  }

  /**
   * List documents for a company, optionally filtered by entity type and ID.
   */
  async getDocuments(companyId: string, entityType?: string, entityId?: string) {
    const where: any = { companyId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single document by ID.
   */
  async getDocument(companyId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    return document;
  }

  /**
   * Get the file buffer for download.
   */
  async getDocumentFile(companyId: string, documentId: string): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const document = await this.getDocument(companyId, documentId);
    const filePath = path.join(this.uploadDir, document.s3Key);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Document file not found on disk');
    }

    return {
      buffer: fs.readFileSync(filePath),
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  /**
   * Delete a document record and its file from disk.
   */
  async deleteDocument(companyId: string, documentId: string) {
    const document = await this.getDocument(companyId, documentId);

    // Delete file from disk
    const filePath = path.join(this.uploadDir, document.s3Key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.document.delete({ where: { id: documentId } });

    this.logger.log(`Document deleted: ${document.filename} (${document.s3Key})`);

    return { deleted: true };
  }
}
