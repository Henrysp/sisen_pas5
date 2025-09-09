import * as fs from 'fs';
import { AxiosResponse } from 'axios';
import { Observable, firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  SignatureParams,
  TimeStampingServiceInterface,
  FormDataServiceInterface,
  FileServiceInterface,
} from '../interfaces/time-stamp-agent.interface';
@Injectable()
export class TimeStampingAgentService implements TimeStampingServiceInterface {
  private readonly logger = new Logger(TimeStampingAgentService.name);

  private readonly credentialAgent: string = process.env.CREDENCIAL_AGENTE || '';
  private readonly urlAgent: string = process.env.URL_AGENTE || '';
  private readonly stampAgentPath: string = process.cwd() + '/assets/img/stamp_agente.PNG';
  private readonly signatureParams: SignatureParams = {
    signatureFormat: 'PAdES',
    signatureLevel: process.env.TSA_SIGNATURE_LEVEL || '',
    signaturePackaging: '',
    webTsa: process.env.TSA_URL || '',
    userTsa: process.env.TSA_USER || '',
    passwordTsa: process.env.TSA_PASSWORD || '',
    contactInfo: '',
    signatureReason: 'Soy el autor del documento',
    signatureStyle: 1,
    stampTextSize: 14,
    stampWordWrap: 37,
    stampPage: 1,
    positionx: 2,
    positiony: 15,
    certificationSignature: false,
  };
  private readonly agentParams: string = JSON.stringify(this.signatureParams);
  private filePath: string;
  private fileName: string;
  private signedPdfPath: string;
  private signedFileName: string;

  constructor(private readonly httpService: HttpService) {}

  async signFile(filePath: string, fileName: string, signedPdfPath: string, signedFileName: string): Promise<any> {
    this.filePath = filePath;
    this.fileName = fileName;
    this.signedPdfPath = signedPdfPath;
    this.signedFileName = signedFileName;

    try {
      const buffer = await this.sendFile();
      await this.createOrVerifyDirectory();
      await this.saveSignedFile(buffer);

      this.logger.log('El archivo firmado ha sido guardado en ', `${this.signedPdfPath}/${this.signedFileName}`);
      return true;
    } catch (error) {
      console.log(error);
      this.logger.error(error.message);
      throw new Error('Error al procesar la solicitud al agente');
    }
  }

  async sendFile() {
    const stamp = fs.createReadStream(this.stampAgentPath);
    const document = fs.createReadStream(`${this.filePath}/${this.fileName}`);

    const formData = new FormData();
    formData.append('param', this.agentParams);
    formData.append('credential', this.credentialAgent);
    formData.append('document', document, { filename: 'document.pdf' });

    formData.append('stamp', stamp, { filename: 'stamp_agente.PNG' });
    const formHeaders = formData.getHeaders();
    const response$: Observable<AxiosResponse<any>> = this.httpService.post<any>(
      process.env.URL_AGENTE,

      formData,
      {
        headers: {
          ...formHeaders,
        },
        responseType: 'arraybuffer',
      },
    );

    /*response$.subscribe((response) => {
      const responseData = response.data;
      console.log('Datos de respuesta:', responseData);
    });*/
    // const response = response$.toPromise();
    const response = await firstValueFrom(response$);

    const responseData = response.data;
    return responseData;
  }

  async createOrVerifyDirectory(): Promise<void> {
    try {
      await fs.promises.access(this.signedPdfPath, fs.constants.F_OK);
    } catch (e) {
      // Si no existe se crea el directorio
      await fs.mkdirSync(this.signedPdfPath, { recursive: true });
    }
  }

  saveSignedFile(buffer): boolean {
    try {
      fs.writeFileSync(`${this.signedPdfPath}/${this.signedFileName}`, buffer, { encoding: 'utf8' });
      return true;
    } catch (e) {
      console.log(e);
      console.log('Error', e.message);
      return false;
    }
  }
}
