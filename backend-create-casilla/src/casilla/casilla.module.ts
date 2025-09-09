import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IndexController } from './controllers/index.controller';
import { CasillaService } from './services/casilla.service';
import { UbigeosController } from './controllers/ubigeos.controller';
import { UbigeosService } from './services/ubigeos.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Ubigeo, UbigeoSchema } from './schemas/ubigeo.schema';
import { CodigoVerificacion, CodigoVerificacionSchema } from './schemas/codigoVerificacion.schema';
import { ValidacionCorreoController } from './controllers/validacionCorreo.controller';
import { ValidacionCelularController } from './controllers/validacionCelular.controller';
import { CodigoVerificacionService } from './services/codigoVerificacion.service';
import { Juridica, JuridicaSchema } from './schemas/juridica.schema';
import { Ciudadano, CiudadanoSchema } from './schemas/ciudadano.schema';
import { CiudadanoService } from './services/ciudadano.service';
import { PersonaNaturalController } from './controllers/personaNatural.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Inbox, InboxSchema } from './schemas/inbox.schema';
import { UserInbox, UserInboxSchema } from './schemas/user_inbox.schema';
import { CasillaController } from './controllers/casilla.controller';
import { UserService } from './services/user.service';
import { EmailService } from './services/email.service';
import { InboxService } from './services/inbox.service';
import { MpveService } from './services/mpve.service';
import { CaptchaService } from './services/captcha.service';
import { Representative, RepresentativeSchema } from './schemas/representative.schema';
import { PersonLegalController } from './controllers/personLegal.controller';
import { RepresentativeService } from './services/representative.service';
import { SmsSevice } from './services/sms.sevice';
import { EventHistory, EventHistorySchema } from './schemas/eventHistory.schema';
import { PdfManagerService } from './services/pdfManager.service';
import { PdfManagerController } from './controllers/pdfManager.controller';
import { TimeStampingAgentService } from './services/timeStampAgent.service';
import { ElectoralProcessController } from './controllers/electoralProcess.controller';
import { ElectoralProcessService } from './services/electoral-process.service';
import { ElectoralProcess, ElectoralProcessSchema } from './schemas/electoralProcess.schema';
import { DuplicatedRecordFilter } from './filters/duplicated-record.filter';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGODB_WEB_USERNAME}:${process.env.MONGODB_WEB_PASSWORD}@${process.env.MONGODB_WEB_HOST}:${process.env.MONGODB_WEB_PORT}/${process.env.MONGODB_WEB_DATABASE}?retryWrites=false`,
      {
        dbName: `${process.env.MONGODB_WEB_DATABASE}`,
      },
    ),
    MongooseModule.forFeature([
      { name: Ubigeo.name, schema: UbigeoSchema },
      { name: CodigoVerificacion.name, schema: CodigoVerificacionSchema },
      { name: Juridica.name, schema: JuridicaSchema },
      { name: Ciudadano.name, schema: CiudadanoSchema },
      { name: User.name, schema: UserSchema },
      { name: Inbox.name, schema: InboxSchema },
      { name: UserInbox.name, schema: UserInboxSchema },
      { name: Representative.name, schema: RepresentativeSchema },
      { name: EventHistory.name, schema: EventHistorySchema },
      { name: ElectoralProcess.name, schema: ElectoralProcessSchema },
    ]),
    HttpModule,
   // TimeStampingAgentService,
  ],
  controllers: [
    IndexController,
    UbigeosController,
    ValidacionCorreoController,
    ValidacionCelularController,
    PersonaNaturalController,
    CasillaController,
    PersonLegalController,
    PdfManagerController,
    ElectoralProcessController,
  ],
  providers: [
    CasillaService,
    UbigeosService,
    CodigoVerificacionService,
    CiudadanoService,
    UserService,
    EmailService,
    InboxService,
    MpveService,
    CaptchaService,
    RepresentativeService,
    SmsSevice,
    PdfManagerService,
    TimeStampingAgentService,
    {
      provide: APP_FILTER,
      useClass: DuplicatedRecordFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    ElectoralProcessService,
  ],
})
export class CasillaModule {}
