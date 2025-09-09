import { Observable } from 'rxjs';
import { ReadStream } from 'fs';
import { AxiosResponse } from 'axios';

interface SignatureParams {
  signatureFormat: string;
  signatureLevel: string;
  signaturePackaging: string;
  webTsa: string;
  userTsa: string;
  passwordTsa: string;
  contactInfo: string;
  signatureReason: string;
  signatureStyle: number;
  stampTextSize: number;
  stampWordWrap: number;
  stampPage: number;
  positionx: number;
  positiony: number;
  certificationSignature: boolean;
}

interface TimeStampingServiceInterface {
  signFile(filePath: string, fileName: string, signedPdfPath: string, signedFileName: string): Promise<any>;
}

interface FormDataServiceInterface {
  getHeaders(): any;
}

interface FileServiceInterface {
  createReadStream(filePath: string): ReadStream;
  writeFileSync(filePath: string, data: any, options?: { encoding?: string }): void;
}

export { SignatureParams, TimeStampingServiceInterface, FormDataServiceInterface, FileServiceInterface };
