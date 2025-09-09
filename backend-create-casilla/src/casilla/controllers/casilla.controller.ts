import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Ip,
  Logger,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
  Get,
  Header,
  Req,
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CasillaService } from '../services/casilla.service';
import { ResponseValidateData } from '../dto/ObtenerDatosPersonaDniResultDto';
import { responseSunat } from '../dto/ObtenerDatosSUNAT';
import { CiudadanoService } from '../services/ciudadano.service';
import { extname } from 'path';
import { CreateInboxRequest } from '../dto/CreateInboxRequest';
import { CaptchaService } from '../services/captcha.service';
import { readFileSync } from 'fs';
import { EmailService } from '../services/email.service';
import { SmsSevice } from '../services/sms.sevice';
import { env } from 'process';
import { InjectModel } from '@nestjs/mongoose';
import { EventHistory, EventHistoryDocument } from '../schemas/eventHistory.schema';
import { Model } from 'mongoose';
import { domainToASCII } from 'url';
import { PdfManagerService } from '../services/pdfManager.service';

export const multerOptions = {
  limits: {
    fileSize: 5242880,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';
    const validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg'];
    if (validMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },
};

@Controller()
export class CasillaController {
  private readonly logger = new Logger(CasillaController.name);

  constructor(
    private readonly casillaService: CasillaService,
    private readonly ciudadaoService: CiudadanoService,
    private readonly recaptchaService: CaptchaService,
    @InjectModel(EventHistory.name)
    private eventHistoryModel: Model<EventHistoryDocument>,
    private smsService: SmsSevice,
    private emailService: EmailService,
    private pdfManagerService: PdfManagerService,
  ) {}

  @Post('create-box')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'filePhoto', maxCount: 1 },
        { name: 'filerepresent', maxCount: 2 },
      ],
      multerOptions,
    ),
  )
  async createBox(
    @Body() dto: CreateInboxRequest,
    @UploadedFiles() files: { filePhoto?: any; filerepresent?: any },
    @Ip() ipAddress,
    @Res() response,
  ): Promise<any> {
    try {
      if (Object.keys(files).length === 0) {
        throw new HttpException('No existe archivos adjuntos', HttpStatus.BAD_REQUEST);
      }

      if (env.DISABLED_RECAPTCHA !== 'true') {
        await this.recaptchaService.validarCapcha(dto.recaptcha, ipAddress);
      }

      const result = await this.casillaService.createBox(dto, files);
      const name = dto.name && (dto.lastname || dto.second_lastname)? `${dto.name} ${dto.lastname || ''} ${dto.second_lastname || ''}`.trim() : '';
      console.log('result from createBox:', result);
      // enviar correo y SMS confirmando la recepcion de la solicitud
      const resultEmail = await this.emailService.enviarCorreo(
        env.EMAIL_ORIGEN,
        dto.email,
        'Nueva Notificación - SISEN',
        this.crearPlantillaCorreo(name),
      );
      this.registerLog(
        'email_sent',
        'inbox',
        result.data.inboxId,
        result.data.userId,
        dto.email,
        resultEmail,
        'solicitud_casilla',
      );
      const resultSMS = await this.smsService.enviarSMS(dto.cellphone, this.buildMessageConfirmacion());
      this.registerLog(
        'sms_sent',
        'inbox',
        result.data.inboxId,
        result.data.userId,
        dto.cellphone,
        resultSMS,
        'solicitud_casilla',
      );

      // enviar correo y SMS al representante si es necesario
      if (dto.docType.toLowerCase() === 'ruc' || dto.docType.toLowerCase() === 'pr') {
        if (dto.email !== result.data.repEmail) {
          const resultEmail = await this.emailService.enviarCorreo(
            env.EMAIL_ORIGEN,
            result.data.repEmail,
            'Nueva Notificación - SISEN',
            this.crearPlantillaCorreo(dto.name),
          );
          this.registerLog(
            'email_sent',
            'inbox',
            result.data.inboxId,
            null,
            result.data.repEmail,
            resultEmail,
            'solicitud_casilla',
            result.data.repId,
          );
        }

        if (dto.cellphone !== result.data.repCellphone) {
          const resultSMS = await this.smsService.enviarSMS(result.data.repCellphone, this.buildMessageConfirmacion());
          this.registerLog(
            'sms_sent',
            'inbox',
            result.data.inboxId,
            null,
            result.data.repCellphone,
            resultSMS,
            'solicitud_casilla',
            result.data.repId,
          );
        }
      }

      // GENERAR PDF DE SOLICITUD
      // await this.pdfManagerService.generatePdf(dto.personType, result.data.inboxId);

      // const result2 = await this.mpveService.enviarDocMesaPartes(dto.tipoDocumento, dto.numeroDocumento);
      return response.status(HttpStatus.OK).send(result);
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      return response.status(err.status ? err.status : 500).send({ success: false, message: err.message });
    }
  }

  buildMessageConfirmacion(): string {
    return `ONPE - SISEN\nHemos recibido tu solicitud, en breve sera evaluado por nuestros especialistas.`;
  }

  crearPlantillaCorreo(nombre: string) {
    const content = readFileSync('./template/enviar-confirmacion-solicitud.html');
    return eval(`\`${content.toString()}\``);
  }

  @Post('validarRUC')
  async validarPersonaJuridica(@Body() ruc: string): Promise<responseSunat> {
    return await this.ciudadaoService.validarDatosSUNAT(ruc);
  }

  registerLog(event, collection, idCollection, idUsuario, sent_to, status, motivo, idRepresentante = null) {
    let event_history = {
      event: event,
      collection: collection,
      id: idCollection,
      idUsuario: idUsuario !== null ? idUsuario : null,
      idRepresentante: idRepresentante,
      sent_to: sent_to,
      status: status,
      motivo: motivo,
      date: new Date(),
    };

    console.log('registering log', event_history);
    const result = this.eventHistoryModel.insertMany(event_history);
  }
}
