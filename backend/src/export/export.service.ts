import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/** Column definition for exports */
export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  isCurrency?: boolean;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Export data to CSV format.
   * @returns Buffer containing the CSV content.
   */
  async exportToCsv(data: any[], columns: ExportColumn[]): Promise<Buffer> {
    const headerRow = columns.map((c) => this.escapeCsvField(c.header)).join(',');
    const dataRows = data.map((row) =>
      columns
        .map((col) => {
          const value = this.getNestedValue(row, col.key);
          return this.escapeCsvField(value != null ? String(value) : '');
        })
        .join(','),
    );

    const csv = [headerRow, ...dataRows].join('\r\n');
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export data to XLSX format using ExcelJS.
   * Includes formatted headers, auto-column widths, and currency formatting.
   * @returns Buffer containing the XLSX content.
   */
  async exportToXlsx(
    data: any[],
    columns: ExportColumn[],
    sheetName: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LedgerFlow';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName);

    // Define columns with proper widths and styles
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || Math.max(col.header.length + 4, 15),
      style: col.isCurrency
        ? { numFmt: '#,##0.0000' }
        : undefined,
    }));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.alignment = { horizontal: 'center' };

    // Add data rows
    for (const row of data) {
      const rowData: Record<string, any> = {};
      for (const col of columns) {
        let value = this.getNestedValue(row, col.key);
        if (col.isCurrency && value != null) {
          value = parseFloat(String(value));
        }
        rowData[col.key] = value;
      }
      worksheet.addRow(rowData);
    }

    // Auto-fit columns based on data
    worksheet.columns.forEach((column) => {
      if (!column || !column.eachCell) return;
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        maxLength = Math.max(maxLength, cellLength);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export data to a simple HTML document formatted as a PDF-ready report.
   * Returns the HTML as a Buffer. (Puppeteer/wkhtmltopdf can be added later for actual PDF.)
   */
  async exportToPdf(
    reportTitle: string,
    companyName: string,
    data: any[],
    columns: ExportColumn[],
    dateRange?: { start?: string; end?: string; asOf?: string },
  ): Promise<Buffer> {
    const dateInfo = dateRange?.asOf
      ? `As of ${dateRange.asOf}`
      : dateRange?.start && dateRange?.end
        ? `${dateRange.start} to ${dateRange.end}`
        : new Date().toISOString().split('T')[0];

    const headerCells = columns
      .map((c) => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #333;background:#4472C4;color:white;font-size:12px;">${this.escapeHtml(c.header)}</th>`)
      .join('');

    const bodyRows = data
      .map((row, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const cells = columns
          .map((col) => {
            const value = this.getNestedValue(row, col.key);
            const displayValue = value != null ? String(value) : '';
            const align = col.isCurrency ? 'right' : 'left';
            return `<td style="padding:6px 12px;text-align:${align};border-bottom:1px solid #dee2e6;font-size:11px;">${this.escapeHtml(displayValue)}</td>`;
          })
          .join('');
        return `<tr style="background:${bgColor}">${cells}</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(reportTitle)} - LedgerFlow</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
    .header { border-bottom: 3px solid #4472C4; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #4472C4; }
    .company-name { font-size: 18px; color: #666; margin-top: 5px; }
    .report-title { font-size: 22px; font-weight: bold; margin-top: 10px; }
    .date-info { font-size: 14px; color: #888; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 10px; color: #888; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LedgerFlow</div>
    <div class="company-name">${this.escapeHtml(companyName)}</div>
    <div class="report-title">${this.escapeHtml(reportTitle)}</div>
    <div class="date-info">${this.escapeHtml(dateInfo)}</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    Generated by LedgerFlow on ${new Date().toISOString().split('T')[0]}
  </div>
</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  // ─── Helpers ────────────────────────────────────────────

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
