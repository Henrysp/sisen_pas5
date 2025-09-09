export interface PdfGeneratorInterface {
  generatePdf(data: any): Promise<Buffer>;
}
