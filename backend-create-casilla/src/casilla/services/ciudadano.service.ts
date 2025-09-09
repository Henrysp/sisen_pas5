import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ciudadano, CiudadanoDocument } from '../schemas/ciudadano.schema';
import { ObtenerDatosPersonaDniResultDto } from '../dto/ObtenerDatosPersonaDniResultDto';
import { ObtenerDatosPersonaDniDto, RequestValidateData } from '../dto/ObtenerDatosPersonaDniDto';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'request-promise';
import { responseSunat } from '../dto/ObtenerDatosSUNAT';
import { CaptchaService } from './captcha.service';
import { PersonLegalRequest } from '../dto/personLegalRequest';
import { IGenericResponse } from '../dto/generic';

export class CiudadanoService {
  constructor(
    @InjectModel(Ciudadano.name)
    private ciudadanoDocument: Model<CiudadanoDocument>,
    private captchaService: CaptchaService,
  ) {}

  async obtenerPersonaPorDni(info: ObtenerDatosPersonaDniDto, ipAddress): Promise<ObtenerDatosPersonaDniResultDto> {
    process.env.DISABLED_RECAPTCHA !== 'true' && (await this.captchaService.validarCapcha(info.recaptcha, ipAddress));

    let result = null;
    try {
      const response = await request({
        uri: `${process.env.URL_RENIEC}`,
        method: 'POST',
        json: true,
        body: {
          codigo: process.env.CODIGO_RENIEC,
          clave: process.env.CLAVE_RENIEC,
          dni: info.dni,
        },
        resolveWithFullResponse: true,
      });

      if (response.statusCode == 200) {
        result = response.body;
        return {
          nombres: result.nombres,
          apellidoPaterno: result.appat,
          apellidoMaterno: result.apmat,
        };
      }
    } catch (err) {
      console.error('Error al obtener datos del ciudadano desde el servidor: ' + err);
      if (err.statusCode == 404) {
        throw new HttpException('El dni solicitado no existe', HttpStatus.NOT_FOUND);
      }
    }
    throw new HttpException('Error al obtener información', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  async obtenerPersonaPorDniBd(info: ObtenerDatosPersonaDniDto, ipAddress): Promise<ObtenerDatosPersonaDniResultDto> {
    // process.env.DISABLED_RECAPTCHA !== 'true' && (await this.captchaService.validarCapcha(info.recaptcha, ipAddress));

    const ciudadano = await this.ciudadanoDocument.findOne(
      {
        dni: info.dni,
      },
      {
        _id: 0,
        nombre: 1,
        paterno: 1,
        materno: 1,
      },
    );
    if (!ciudadano) {
      throw new HttpException('El dni solicitado no existe', HttpStatus.NOT_FOUND);
    }
    console.log(ciudadano);
    return {
      nombres: ciudadano.nombre,
      apellidoPaterno: ciudadano.paterno,
      apellidoMaterno: ciudadano.materno,
    };
  }

  async validarDatosPersona(req: RequestValidateData) {
    console.log('datos', req);
    let ciudadano = null;
    try {
      const response = await request({
        uri: `${process.env.URL_RENIEC}`,
        method: 'POST',
        json: true,
        body: {
          codigo: process.env.CODIGO_RENIEC,
          clave: process.env.CLAVE_RENIEC,
          dni: req.nroDocumento,
        },
        resolveWithFullResponse: true,
      });

      if (response.statusCode == 200) {
        const result = response.body;
        ciudadano = {
          fenac: result.fecnac,
          digverifica: result.digver,
        };
      }
    } catch (err) {
      ciudadano = await this.ciudadanoDocument.findOne(
        {
          dni: req.nroDocumento,
        },
        {
          _id: 0,
          fenac: 1,
          digverifica: 1
        },
      );
      if(ciudadano){} else { console.error('Error al consultar el servicio de personas: ' + err); }
    }

    console.log('validar ciudadano:', ciudadano);

    if (ciudadano) {
      const dateNacRequest = this.changueDate(new Date(req.fechaNacimiento)); //this.changueDate(request.fechaNacimiento);
      const fechaNac = this.changueDate(this.parseDate(ciudadano.fenac));

      if (req.codigoVerifi == ciudadano.digverifica && dateNacRequest === fechaNac) {
        return {
          status: true,
          mensaje: 'Datos correctos.',
        };
      } else {
        return {
          status: false,
          mensaje: 'Alguno de sus datos personales no coinciden, por favor verifique e intente nuevamente.',
        };
      }
    } else {
      return { status: false, mensaje: 'Persona no encontrada.' };
    }
  }

  async validarDatosPersonaBd(request: RequestValidateData) {
    console.log('datos', request);
    const ciudadano = await this.ciudadanoDocument.findOne(
      {
        dni: request.nroDocumento,
      },
      {
        _id: 0,
        fenac: 1,
        digverifica: 1,
      },
    );
    console.log('validar ciudadano:', ciudadano);

    if (ciudadano) {
      const dateNacRequest = request.fechaNacimiento.substring(0, 10).replace(/-/g, '');
      if (request.codigoVerifi == ciudadano.digverifica && dateNacRequest === ciudadano.fenac) {
        return {
          status: true,
          mensaje: 'Datos correctos.',
        };
      } else {
        return {
          status: false,
          mensaje: 'Alguno de sus datos personales no coinciden, por favor verifique e intente nuevamente.',
        };
      }
    } else {
      return { status: false, mensaje: 'Persona no encontrada.' };
    }
  }

  parseDate(str) {
    const y = parseInt(str.substring(0, 4)),
      m = parseInt(str.substring(4, 6)) - 1,
      d = parseInt(str.substring(6, 8));
    const D = new Date(y, m, d);
    if (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) {
      return D;
    }
    console.error('Error al parsear la fecha');
    return null;
  }

  nombresPadre(nombre: string): string[] {
    return ['JULIO', 'JUAN', 'DANIEL', nombre];
  }
  nombresMadre(nombre: string): string[] {
    return ['JULIA', 'JUANA', 'DANIELA', nombre];
  }

  changueDate(date: Date) {
    const realDateObject = new Date(date);

    const day = realDateObject.getDate();
    const month = realDateObject.getMonth() + 1;
    const year = realDateObject.getFullYear();

    if (month < 10) {
      return `${day}-0${month}-${year}`;
    } else {
      return `${day}-${month}-${year}`;
    }
  }

  async getPersonLegalByRuc(data: PersonLegalRequest): Promise<any> {
    const response: IGenericResponse<any> = {
      success: false,
    };

    const newData: any = {};

    try {
      if (process.env.DISABLED_API_SUNAT !== 'true') {
        const responseConsult = await request({
          uri: `${process.env.URL_SUNAT}`,
          qs: {
            numruc: data.ruc,
            out: 'json',
          },
          headers: {
            Accept: 'application/json',
          },
          resolveWithFullResponse: true,
        });

        if (responseConsult.statusCode === 200) {
          const responseBody = JSON.parse(responseConsult.body);

          if (responseBody.list.multiRef) {
            const newBody = responseBody.list.multiRef;
            newData.organizationName = newBody.ddp_nombre?.$ ? newBody.ddp_nombre.$.trim() : '';
            newData.type = newBody.desc_identi.$;
            newData.ruc = newBody.ddp_numruc.$;
            if (newData.organizationName === undefined || newData.organizationName === '') {
              response.message = 'El RUC solicitado no existe';
              response.success = false;
            } else {
              response.data = newData;
              response.success = true;
            }
          }
        } else {
          response.message = 'error servicio sunat';
        }
      } else {
        response.data = {
          organizationName: 'ONPE || pruebas',
          ruc: data.ruc,
        };
        response.success = true;
      }

      return response;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPersonLegalByRucDB(data: PersonLegalRequest): Promise<any> {
    const response: IGenericResponse<any> = {
      success: false,
    };

    // const organization = null;
    const organization = { docType: 'ruc', doc: data.ruc, name: 'ONPE' };
    // const organization = await this.ciudadanoDocument.findOne(
    //   { dni: info.ruc },
    //   {
    //     _id: 0,
    //     nombre: 1,
    //     paterno: 1,
    //     materno: 1,
    //   },
    // );

    if (!organization) {
      throw new HttpException('El RUC solicitado no existe', HttpStatus.NOT_FOUND);
    }
    console.log(organization);

    response.success = true;
    response.data = {
      organizationName: organization.name,
    };

    return response;
  }

  async validarDatosSUNAT(ruc) {
    try {
      let asd: responseSunat = new responseSunat();
      console.log('RUUUUUUUUUUUC', ruc.ruc);

      //var data = this.mySoapClient.DatosPrincipales({numdo :ruc});
      const response = await request({
        uri: `${process.env.URL_SUNAT}`,
        qs: {
          numruc: ruc.ruc,
          out: 'json',
        },
        headers: {
          Accept: 'application/json',
        },
        resolveWithFullResponse: true,
      });

      console.log('RESPUESTA', response);

      if (response.statusCode == 200) {
        asd = {
          razonSocial: JSON.parse(response.body),
          success: true,
        };
      } else {
        asd = {
          razonSocial: 'error servicio sunat',
          success: false,
        };
      }

      return asd;
    } catch (error) {
      console.error(error);
      // return  {
      //   razonSocial : error,
      //   success : false
      // }
    }
  }
}
