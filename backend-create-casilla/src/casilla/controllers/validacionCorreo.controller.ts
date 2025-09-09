import { Body, Controller, Ip, Post } from '@nestjs/common';
import { CodigoVerificacionService } from '../services/codigoVerificacion.service';
import { EnviarCorreoVerificacionDto } from '../dto/EnviarCorreoVerificacionDto';
import { ValidarCodigoDto } from '../dto/ValidarCodigoDto';
import { InboxService } from '../services/inbox.service';
import { CaptchaService } from '../services/captcha.service';
import * as process from 'process';

@Controller()
export class ValidacionCorreoController {
  constructor(
    private readonly codigoVerificacionService: CodigoVerificacionService,
    private readonly inboxService: InboxService,
    private readonly recaptchaService: CaptchaService,
  ) {}

  @Post('enviar-correo-verificacion')
  async enviarCorreoVerificacion(@Body() dto: EnviarCorreoVerificacionDto, @Ip() ipAddress) {
    process.env.DISABLED_RECAPTCHA !== 'true' && (await this.recaptchaService.validarCapcha(dto.recaptcha, ipAddress));
    const delaySend = parseInt(process.env.OTP_RESEND_DELAY_SECONDS, 10);
    const resend = await this.codigoVerificacionService.ResendDelay(dto.correoElectronico, delaySend);
    if (resend) {
      return await this.codigoVerificacionService.enviarCodigoVerificacion(
        dto.tipoDocumento.toLowerCase(),
        dto.numeroDocumento,
        dto.correoElectronico.toLowerCase(),
      );
    }else{
      return false;
    }
  }

  @Post('validar-codigo-verificacion')
  async validarCodigo(@Body() dto: ValidarCodigoDto, @Ip() ipAddress) {
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
    const existUserWithEmail = await this.inboxService.existeCasilleroConCorreo(
      dto.correo,
      dto.tipoDocumento.toLowerCase(),
      dto.personType,
    );
    if (existUserWithEmail) {
      console.log('El correo electrónico ya se encuentra en uso');
      return {
        esValido: false,
        mensaje: 'El correo electrónico ya se encuentra en uso',
      };
    }
    return {
      esValido: true,
      mensaje: 'El codigo fue validado exitosamente',
    };
  }
}
