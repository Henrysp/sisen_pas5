import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Types } from 'mongoose';
import { CodigoVerificacion, CodigoVerificacionDocument } from '../schemas/codigoVerificacion.schema';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { EmailService } from './email.service';
import { SmsSevice } from './sms.sevice';
import * as process from 'process';
import { EventHistory, EventHistoryDocument } from '../schemas/eventHistory.schema';
import { json } from 'express';

export class CodigoVerificacionService {
  constructor(
    @InjectModel(CodigoVerificacion.name)
    private codigoVerificacionModel: Model<CodigoVerificacionDocument>,
    @InjectModel(EventHistory.name)
    private eventHistoryModel: Model<EventHistoryDocument>,
    private emailService: EmailService,
    private smsService: SmsSevice,

  ) {}

  async enviarCodigoVerificacion(tipoDocumento, numeroDocumento, correo) {
    const codigo = randomBytes(3).toString('hex').toUpperCase();
    // const minutosValidez = 5;
    const minutosValidez = parseInt(process.env.OTP_EXPIRATION_TIME, 10);
    const ahora = new Date();
    const validez = new Date(ahora.getTime() + 1000 * 60 * minutosValidez);

    const result = await this.codigoVerificacionModel.insertMany({
      tipoDocumento: tipoDocumento,
      numeroDocumento: numeroDocumento,
      correoElectronico: correo,
      codigo: codigo,
      fechaCreacion: ahora,
      validoHasta: validez,
      intentosValidacion: 0,
      activo: true,
      tipoServicio: 'EMAIL',
    });
    let id;
    if (result.length == 1) {
      id = result[0]._id;
    } else {
      id = null;
    }
    const resultEmail = await this.emailService.enviarCorreo(
      process.env.EMAIL_ORIGEN,
      correo,
      'Nueva Notificación - SISEN',
      this.crearPlantillaCorreo(codigo),
    );
    
    //Register Logs
    this.registerLog("email_sent", "codigoVerificacion", id, null, correo, resultEmail, "envio_codigo_verificacion");

    return {
      idEnvio: id,
    };
  }

  crearPlantillaCorreo(codigo: string) {
    const content = readFileSync('./template/enviar-codigo-verificacion.html');
    return eval(`\`${content.toString()}\``);
  }

  async validarCodigoVerificacion(tipoDocumento: string, numeroDocumento: string, idEnvio: string, codigo: string) {
    const result = await this.codigoVerificacionModel.findOne({
      _id: idEnvio,
    });
    if (!result) {
      console.log('No se encontró un registro con el id para los datos para validar el código', idEnvio);
      return { esValido : false, message : 'No se encontró un registro con el id para los datos para validar el código'};
    }
    if (result.codigo !== codigo) {
      this.incrementarIntentos(idEnvio, result.intentosValidacion);
      console.log('El código de verificación es incorrecto');
      return { esValido : false, message : 'El código de verificación es incorrecto'};
    }
    console.log(result.validoHasta, new Date());
    if (result.validoHasta < new Date()) {
      console.log('El código de verificación ha expirado');
      return { esValido : false, message : 'El código de verificación ha expirado. Solicite un nuevo código de verificación'};
    }
    if (result.intentosValidacion >= 3) {
      console.log('Se alcanzó el número máximo de intentos de validación del código');
      return { esValido : false, message : 'Se alcanzó el número máximo de intentos de validación del código'};
    }
    if (result.tipoDocumento !== tipoDocumento && result.numeroDocumento !== numeroDocumento) {
      this.incrementarIntentos(idEnvio, result.intentosValidacion);
      console.log(
        'El tipo y número de documento no coinciden con el registro a validar',
        idEnvio,
        tipoDocumento,
        numeroDocumento,
      );
      return { esValido : false, message : 'El tipo y número de documento no coinciden con el registro a validar'};
    }
    if (!result.activo) {
      console.log('El código ya no está activo');
      return { esValido : false, message : 'El código ya no está activo'};
    }
    this.desactivarCodigo(idEnvio);
    return { esValido: true };
  }

  incrementarIntentos(idEnvio: string, intentosActuales: number) {
    this.codigoVerificacionModel.updateOne(
      {
        _id: idEnvio,
      },
      {
        $set: {
          intentosValidacion: intentosActuales + 1,
        },
      },
    );
  }

  desactivarCodigo(idEnvio: string) {
    this.codigoVerificacionModel.updateOne(
      {
        _id: idEnvio,
      },
      {
        $set: {
          activo: false,
        },
      },
    );
  }

  async enviarCodigoVerificacionSMS(tipoDocumento, numeroDocumento, numeroCelular) {
    const codigo = randomBytes(3).toString('hex').toUpperCase();
    // const minutosValidez = 5;
    const minutosValidez = parseInt(process.env.OTP_EXPIRATION_TIME, 10);
    const ahora = new Date();
    const validez = new Date(ahora.getTime() + 1000 * 60 * minutosValidez);

    const result = await this.codigoVerificacionModel.insertMany({
      tipoDocumento: tipoDocumento,
      numeroDocumento: numeroDocumento,
      numeroCelular: numeroCelular,
      codigo: codigo,
      fechaCreacion: ahora,
      validoHasta: validez,
      intentosValidacion: 0,
      activo: true,
      tipoServicio: 'SMS',
    });
    let id;
    if (result.length == 1) {
      id = result[0]._id;
    } else {
      id = null;
    }

    const resultSMS = await this.smsService.enviarSMS(numeroCelular, this.buildMessage(codigo));
    this.registerLog("sms_sent", "codigoVerificacion", id, null, numeroCelular, resultSMS, "envio_codigo_verificacion");

    return { idEnvio: id };
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

  buildMessage(code: string): string {
    return `ONPE - SISEN\nIngresa el codigo de verificacion ${code} para validar tu numero de celular.`;
  }
  async ResendDelay(receptor: string, delayInSeconds: number) {
    const now = new Date();
    const ultimo = await this.codigoVerificacionModel
      .findOne({
        $or: [{ correoElectronico: receptor }, { numeroCelular: receptor }],
      })
      .sort({ fechaCreacion: -1 });

    if (!ultimo) {
      return true;
    } else {
      const diffInSeconds = (now.getTime() - ultimo.fechaCreacion.getTime()) / 1000;
      return diffInSeconds >= delayInSeconds;
    }
  }
}
