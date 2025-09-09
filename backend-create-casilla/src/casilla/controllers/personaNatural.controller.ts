import { Body, Controller, Ip, Post } from '@nestjs/common';
import { ObtenerDatosPersonaDniDto, RequestValidateData } from '../dto/ObtenerDatosPersonaDniDto';
import { CiudadanoService } from '../services/ciudadano.service';
import { ObtenerDatosPersonaDniResultDto, ResponseValidateData } from '../dto/ObtenerDatosPersonaDniResultDto';
import { InboxService } from '../services/inbox.service';
import { CaptchaService } from '../services/captcha.service';

@Controller()
export class PersonaNaturalController {
  constructor(
    private readonly ciudadanoService: CiudadanoService,
    private readonly inboxService: InboxService,
    private readonly recaptchaService: CaptchaService,
  ) {}

  @Post('obtener-datos-persona-dni')
  async obtenerDatosPersonaDni(
    @Body() obtenerDatosPersonaDniDto: ObtenerDatosPersonaDniDto,
    @Ip() ipAddress,
  ): Promise<ObtenerDatosPersonaDniResultDto> {
    return await this.ciudadanoService.obtenerPersonaPorDni(obtenerDatosPersonaDniDto, ipAddress);
  }

  @Post('obtener-datos-persona-dni-db')
  async obtenerDatosPersonaDniDb(
    @Body() ObtenerDatosPersonaDniDto: ObtenerDatosPersonaDniDto,
    @Ip() ipAddress,
  ): Promise<ObtenerDatosPersonaDniResultDto> {
    return await this.ciudadanoService.obtenerPersonaPorDniBd(ObtenerDatosPersonaDniDto, ipAddress);
  }

  @Post('validarPersona')
  async validarPersona(@Body() request: RequestValidateData, @Ip() ipAddress): Promise<ResponseValidateData> {
    let resultado;
    request.tipoDocumento = request.tipoDocumento.toLowerCase();
    process.env.DISABLED_RECAPTCHA !== 'true' && (await this.recaptchaService.validarCapcha(request.recaptcha, ipAddress));

    if (request.tipoDocumento == 'dni') {
      resultado = await this.ciudadanoService.validarDatosPersona(request);
    } else {
      resultado = { status: true, mensaje: 'Datos correctos.' };
    }
    if (resultado.status) {
      const inboxWithDoc = await this.inboxService.existeCasilleroConDoc(request.tipoDocumento, request.nroDocumento);
      if (inboxWithDoc.exist) {
        resultado.status = false;
        resultado.mensaje = inboxWithDoc.message;
      }
    }
    return resultado;
  }
}
