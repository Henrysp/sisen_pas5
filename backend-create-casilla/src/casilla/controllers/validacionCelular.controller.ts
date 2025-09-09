import { Body, Controller, Ip, Post } from '@nestjs/common';
import { CodigoVerificacionService } from '../services/codigoVerificacion.service';
import { InboxService } from '../services/inbox.service';
import { CaptchaService } from '../services/captcha.service';
import { EnviarSMSVerificacionDto } from '../dto/EnviarSMSVerificacionDto';
import { ValidarCodigoDto } from '../dto/ValidarCodigoDto';
import * as process from 'process';

@Controller()
export class ValidacionCelularController {
  constructor(
    private readonly codigoVerificacionService: CodigoVerificacionService,
    private readonly inboxService: InboxService,
    private readonly recaptchaService: CaptchaService,
  ) {}

  @Post('enviar-sms-verificacion')
  async enviarSmsVerificacion(@Body() dto: EnviarSMSVerificacionDto, @Ip() ipAddress) {
    process.env.DISABLED_RECAPTCHA !== 'true' && (await this.recaptchaService.validarCapcha(dto.recaptcha, ipAddress));
    const delaySend = parseInt(process.env.OTP_RESEND_DELAY_SECONDS, 10);
    const resend = await this.codigoVerificacionService.ResendDelay(dto.numeroCelular, delaySend);
    if(resend){
      return await this.codigoVerificacionService.enviarCodigoVerificacionSMS(
        dto.tipoDocumento.toLowerCase(),
        dto.numeroDocumento,
        dto.numeroCelular.toLowerCase(),
      );
    }else{
      return false
    }
  }

  @Post('validar-codigo-verificacion-sms')
  async validarCodigoSms(@Body() dto: ValidarCodigoDto, @Ip() ipAddress) {
    console.log(ValidarCodigoDto);
    process.env.DISABLED_RECAPTCHA !== 'true' && (await this.recaptchaService.validarCapcha(dto.recaptcha, ipAddress));

    const valido = await this.codigoVerificacionService.validarCodigoVerificacion(
      dto.tipoDocumento.toLowerCase(),
      dto.numeroDocumento,
      dto.idEnvio,
      dto.codigo,
    );
    if (!valido.esValido) {
      console.log('El código de verificación es incorrecto');
      return {
        esValido: false,
        mensaje: valido.message,
      };
    }

    const existUserWithEmail = await this.inboxService.existeCasilleroConCelular(
      dto.celular,
      dto.tipoDocumento.toLowerCase(),
      dto.personType,
    );
    if (existUserWithEmail) {
      console.log('El número de celular ya se encuentra en uso');
      return {
        esValido: false,
        mensaje: 'El número de celular ya se encuentra en uso',
      };
    }
    return {
      esValido: true,
      mensaje: 'El codigo fue validado exitosamente',
    };
  }
}
