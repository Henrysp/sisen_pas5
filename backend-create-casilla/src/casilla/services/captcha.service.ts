import * as request from 'request-promise';
import { HttpException, HttpStatus } from '@nestjs/common';

export class CaptchaService {
  async validarCapcha(code, ip) {
    console.log(code, ' ', ip);
    let result = false;
    try {
      const gResponse = await request({
        url: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        json: true,
        form: {
          secret: process.env.RECAPTCHA_SECRET,
          response: code,
          remoteip: ip,
        },
      });

      if (gResponse) {
        result = gResponse.success;
      } else {
        console.error('Error en reCAPTCHA:', gResponse['error-codes']);
      }
    } catch (err) {
      console.error(err);
      throw new HttpException('Error al validar capcha: ' + err, HttpStatus.UNAUTHORIZED);
    }
    if (!result) {
      throw new HttpException('Captcha inválido, refresque la página e intente nuevamente', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
