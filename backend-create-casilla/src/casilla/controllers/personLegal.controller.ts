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
} from '@nestjs/common';
import { InboxService } from '../services/inbox.service';
import { CaptchaService } from '../services/captcha.service';
import {
  InboxPersonLegalRequest,
  PersonLegalRequest,
  RepresentativeRequest,
  ValidateRepresentativeRequest,
  ValidPersonLegalRequest,
} from '../dto/personLegalRequest';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { CiudadanoService } from '../services/ciudadano.service';
import { IGenericResponse } from '../dto/generic';
import { CasillaService } from '../services/casilla.service';
import { RepresentativeService } from '../services/representative.service';
import { readFileSync } from 'fs';
import { EmailService } from '../services/email.service';
import { SmsSevice } from '../services/sms.sevice';
import { env } from 'process';
import { EventHistory, EventHistoryDocument } from '../schemas/eventHistory.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PdfManagerService } from '../services/pdfManager.service';
import { PersonTypeEnum } from '../common/enums/personTypeEnum';

export const multerOptions = {
  limits: {
    fileSize: 10485760,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg' | 'application/pdf';
    const validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    if (validMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },
};

@Controller('/legal')
export class PersonLegalController {
  private readonly logger = new Logger(PersonLegalController.name);

  constructor(
    private readonly ciudadanoService: CiudadanoService,
    private readonly casillaService: CasillaService,
    private readonly inboxService: InboxService,
    private readonly representativeService: RepresentativeService,
    private readonly recaptchaService: CaptchaService,
    private smsService: SmsSevice,
    private emailService: EmailService,
    @InjectModel(EventHistory.name)
    private eventHistoryModel: Model<EventHistoryDocument>,
    private pdfManagerService: PdfManagerService,
  ) {}

  @Post('/person/data')
  async getPersonLegalByRUC(@Body() data: PersonLegalRequest, @Ip() ipAddress, @Res() response): Promise<any> {
    try {
      process.env.DISABLED_RECAPTCHA !== 'true' && (await this.recaptchaService.validarCapcha(data.recaptcha, ipAddress));

      const result = await this.ciudadanoService.getPersonLegalByRuc(data);
      // const result = await this.ciudadanoService.getPersonLegalByRucDB(data);

      return response.status(HttpStatus.OK).send(result);
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      return response.status(err.status ? err.status : 500).send({ success: false, message: err.message, statusCode: err.status });    }
  }

  @Post('/person/validate')
  async validatePersonLegal(@Body() request: ValidPersonLegalRequest, @Ip() ipAddress, @Res() response): Promise<any> {
    console.log(request);
    const result: IGenericResponse<any> = {
      success: true,
    };

    request.docType = request.docType.toLowerCase();

    try {
      process.env.DISABLED_RECAPTCHA !== 'true' &&
      +        (await this.recaptchaService.validarCapcha(request.recaptcha, ipAddress));

      // const result = await this.ciudadanoService.validPersonRUCDB(request);

      // if (result.success) {
      const existInbox = await this.inboxService.existeCasilleroConDoc(request.docType, request.doc);
      if (existInbox.exist) {
        result.success = false;
        result.message = existInbox.message;
      }
      // }

      return response.status(HttpStatus.OK).send(result);
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      return response.status(err.status ? err.status : 500).send({ success: false, message: err.message, statusCode: err.status });
    }
  }

  @Post('/representative/data')
  async getRepresentativeByDNI(@Body() data: RepresentativeRequest, @Ip() ipAddress, @Res() response): Promise<any> {
    const result: IGenericResponse<any> = {
      success: true,
    };

    try {
      if (env.DISABLED_RECAPTCHA !== 'true') {
        await this.recaptchaService.validarCapcha(data.recaptcha, ipAddress);
      }

      const resultData = await this.ciudadanoService.obtenerPersonaPorDni(data, ipAddress);
      // const resultData = await this.ciudadanoService.obtenerPersonaPorDniBd(data, ipAddress);

      if (resultData) {
        result.success = true;
        result.data = {
          name: resultData.nombres,
          lastname: resultData.apellidoPaterno,
          second_lastname: resultData.apellidoMaterno,
        };
      }

      return response.status(HttpStatus.OK).send(result);
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      return response.status(err.status ? err.status : 500).send({ success: false, message: err.message });
    }
  }

  @Post('/representative/validate')
  async validateRepresentative(
    @Body() request: ValidateRepresentativeRequest,
    @Ip() ipAddress,
    @Res() response,
  ): Promise<any> {
    const result: IGenericResponse<any> = {
      success: true,
    };

    request.docType = request.docType.toLowerCase();

    try {
      if (env.DISABLED_RECAPTCHA !== 'true') {
        await this.recaptchaService.validarCapcha(request.recaptcha, ipAddress);
      }
      // const result = await this.personLegalService.validateRepresentativeDB(request);

      // if (result.success) {
      // Se quito validación de representante repetido
      // const existInbox = await this.representativeService.findByDoc({
      //   docType: request.docType,
      //   doc: request.doc,
      //   ruc: request.ruc,
      // });
      // if (!existInbox.success) {
      //   result.success = false;
      //   result.message = existInbox.message;
      // }
      // }

      return response.status(HttpStatus.OK).send(result);
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      return response.status(err.status ? err.status : 500).send({ success: false, message: err.message });
    }
  }

  @Post('/inbox/create-box')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'fileDocument1', maxCount: 1 },
        { name: 'fileDocument2', maxCount: 1 },
        { name: 'filePhoto', maxCount: 1 },
        { name: 'fileBox1', maxCount: 1},
        { name: 'fileBox2', maxCount: 1}
      ],
      multerOptions,
    ),
  )
  public async createBox(
    @Body() data: InboxPersonLegalRequest,
    @UploadedFiles() files: { fileDocument1?: any; fileDocument2?: any;  filePhoto?: any; fileBox1?: any; fileBox2?: any },
    @Ip() ipAddress,
    @Res() response,
  ): Promise<any> {
    try {
      if (Object.keys(files).length === 0) {
        throw new HttpException('No existe archivos adjuntos', HttpStatus.BAD_REQUEST);
      }

      if (env.DISABLED_RECAPTCHA !== 'true') {
        await this.recaptchaService.validarCapcha(data.recaptcha, ipAddress);
      }

      const result = await this.casillaService.createBox(data, files);

      // enviar correo confirmando la recepcion de la solicitud
      const resultEmail = await this.emailService.enviarCorreo(
        env.EMAIL_ORIGEN,
        data.email,
        'Nueva Notificación - SISEN',
        this.crearPlantillaCorreo(data.organizationName),
      );
      this.registerLog("email_sent", "inbox", result.data.inboxId, result.data.userId, data.email, resultEmail, "solicitud_casilla");
      const resultSMS = await this.smsService.enviarSMS(data.cellphone, this.buildMessageConfirmacion());
      this.registerLog("sms_sent", "inbox", result.data.inboxId, result.data.userId, data.cellphone, resultSMS, "solicitud_casilla");

      // enviar correo y SMS al representante si es necesario
      if (data.docType.toLowerCase() === "ruc" || data.docType.toLowerCase() === "pr"){
        if(data.email !== result.data.repEmail){
          const resultEmail = await this.emailService.enviarCorreo(
            env.EMAIL_ORIGEN,
            result.data.repEmail,
            'Nueva Notificación - SISEN',
            this.crearPlantillaCorreo(data.organizationName),
          );
          this.registerLog("email_sent", "inbox", result.data.inboxId, null, result.data.repEmail, resultEmail, "solicitud_casilla", result.data.repId);
        }

        if (data.cellphone !== result.data.repCellphone){
          const resultSMS = await this.smsService.enviarSMS(result.data.repCellphone, this.buildMessageConfirmacion());
          this.registerLog("sms_sent", "inbox", result.data.inboxId, null, result.data.repCellphone, resultSMS, "solicitud_casilla", result.data.repId);
        }
      }
      //GENERAR PDF DE SOLICITUD
      // await this.pdfManagerService.generatePdf(PersonTypeEnum.PJ, result.data.inboxId);

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

  registerLog (event, collection, idCollection, idUsuario, sent_to, status, motivo, idRepresentante = null) {
    let event_history = {
        event: event,
        collection: collection,
        id: idCollection,
        idUsuario: idUsuario !== null ? idUsuario : null,
        idRepresentante: idRepresentante,
        sent_to: sent_to,
        status: status,
        motivo: motivo,
        date: new Date()
    }
    
    const result = this.eventHistoryModel.insertMany(event_history);
  }
}
