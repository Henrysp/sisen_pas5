import { Length } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inbox, InboxDocument } from '../schemas/inbox.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UserInbox, userInboxDocument } from '../schemas/user_inbox.schema';
import * as fs from 'fs';
import * as cryptoJS from 'crypto';
import sha256 from 'crypto-js/sha256';
import { CaptchaService } from './captcha.service';
import { IGenericResponse } from '../dto/generic';
import { ConsoleLogger, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Constants } from '../common/constants';
import { Representative, RepresentativeDocument } from '../schemas/representative.schema';
import { PersonTypeEnum } from '../common/enums/personTypeEnum';
import { RepresentativeService } from './representative.service';

export class CasillaService {
  private readonly logger = new Logger(CasillaService.name);

  constructor(
    @InjectModel(User.name)
    private userDocument: Model<UserDocument>,
    @InjectModel(Inbox.name)
    private inboxDocument: Model<InboxDocument>,
    @InjectModel(UserInbox.name)
    private userInboxDocument: Model<userInboxDocument>,
    @InjectModel(Representative.name)
    private representativeDocument: Model<RepresentativeDocument>,
    private representativeService: RepresentativeService,
    private captchaService: CaptchaService,
  ) {}

  saludar(nombre: string) {
    return 'hola ' + nombre;
  }

  async createBox(data: any, files) {
    const response: IGenericResponse<any> = {
      success: false,
    };

    data.personType = data.personType.toLowerCase();
    data.docType = data.docType.toLowerCase();
    data.email = data.email.toLowerCase();
    data.doc = data.doc.toUpperCase();

    data.name = typeof data.name !== 'undefined' ? data.name.toUpperCase() : '';
    data.lastname = typeof data.lastname !== 'undefined' ? data.lastname.toUpperCase() : '';
    data.second_lastname = typeof data.second_lastname !== 'undefined' ? data.second_lastname.toUpperCase() : '';

    let userId = '';
    let inboxId = '';
    let oFileDocument1 = {};
    let oFileDocument2 = {};
    let oFileBox1 = {};
    let oFileBox2 = {};
    let oFilePhoto = {};
    const attachments = [];

    try {
      const pass = cryptoJS.randomBytes(5).toString('hex');
      const personNatural = { name: '', lastname: '', second_lastname: '' };
      let organizationName = '';
      let numeroPartida = '';
      let webSite = '';
      let photoDoc = '';
      let rep: any;
      let fileDocument1: any;
      let fileDocument2: any;
      let fileBox1: any;
      let fileBox2: any;

      const filePhoto = files.filePhoto ? files.filePhoto[0] : undefined;
      if (filePhoto == undefined) {
        throw new HttpException('Falta uno o varios archivos adjuntos', HttpStatus.BAD_REQUEST);
      }

      if (!this.validFile(filePhoto)) {
        response.message = 'Archivo de imagen está dañado o no es válido';
        throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
      }

      if (data.personType === PersonTypeEnum.PJ) {
        rep = JSON.parse(data.rep);
        organizationName = data.organizationName.toUpperCase();
        numeroPartida = data.numeroPartida;
        webSite = data.webSite;
        photoDoc = rep.doc;

        // fileDocument1 = files.fileDocument1 ? files.fileDocument1[0]: undefined;
        // if (fileDocument1 != undefined) {
        //   if (!this.validFile(fileDocument1)) {
        //     response.message = 'Archivo pdf está dañado o no es válido';
        //     throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        //   }
        // }else {
        //   response.message = 'Falta archivo adjunto';
        //   throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        // }
        //
        // if (files.fileDocument2 !== undefined) {
        //   fileDocument2 = files.fileDocument2[0];
        //   if (fileDocument2 != undefined) {
        //     if (!this.validFile(fileDocument2)) {
        //       response.message = 'Archivo pdf está dañado o no es válido';
        //       throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        //     }
        //   }
        // }

        fileBox1 = files.fileBox1 ? files.fileBox1[0]: undefined;
        if (fileBox1 != undefined) {
          if (!this.validFile(fileBox1)) {
            response.message = 'Archivo pdf está dañado o no es válido';
            throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
          }
        }else {
          response.message = 'Falta archivo adjunto';
          throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        }

        if (files.fileBox2 !== undefined) {
          fileBox2 = files.fileBox2[0];
          if (fileBox2 != undefined) {
            if (!this.validFile(fileBox2)) {
              response.message = 'Archivo pdf está dañado o no es válido';
              throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
            }
          }
        }
      }

      if (data.personType === PersonTypeEnum.PN) {
        personNatural.name = data.name.toUpperCase();
        personNatural.lastname = typeof data.lastname !== 'undefined' ? data.lastname.toUpperCase() : '';
        personNatural.second_lastname =
          typeof data.second_lastname !== 'undefined' ? data.second_lastname.toUpperCase() : '';
        photoDoc = data.doc;

        if (personNatural.lastname == '' && personNatural.second_lastname == '') {
          response.message = 'Ingrese por lo menos un apellido';
          throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        }
      }

      const resultUser = await new this.userDocument({
        doc: data.doc,
        doc_type: data.docType,
        profile: Constants.PROFILE_CITIZEN,
        password: pass,
        password_old: pass,
        name: personNatural.name,
        lastname: personNatural.lastname,
        second_lastname: personNatural.second_lastname,
        numeroPartida: numeroPartida,
        asientoRegistral: data.asientoRegistral,
        email: data.email,
        cellphone: data.cellphone,
        phone: data.phone,
        Ubigeo: data.ubigeo,
        address: data.address,
        PaginaWeb: webSite,
        organization_name: organizationName,
        register_user_id: '',
        created_at: Date.now(),
        updated_password: false,
        create_user: Constants.USER_OWNER,
        status: Constants.STATUS_PENDING,
        orgPol: data.orgPol,
      }).save();

      if (!resultUser) {
        response.message = 'Sus datos no han sido guardados correctamente, por favor inténtelo más tarde.';
        throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
      }

      userId = resultUser._id;

      oFilePhoto = await this.copyFile(
        filePhoto.buffer,
        'box/',
        decodeURIComponent(filePhoto.originalname),
        photoDoc,
        Date.now(),
        false,
        false,
      );

      if (typeof oFilePhoto != 'object') {
        response.message = 'Sus datos no han sido guardados correctamente, por favor inténtelo más tarde.';
        throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
      }

      const tmpFullName = data.name + ' ' + data.lastname + ' ' + data.second_lastname;
      let dataInbox = {};

      if (data.statusCandidateElectoralProcess === 'Sí') {
        dataInbox = {
          doc: data.doc,
          doc_type: data.docType,
          numeroPartida: numeroPartida,
          asientoRegistral: data.asientoRegistral,
          email: data.email,
          cellphone: data.cellphone,
          phone: data.phone,
          address: data.address,
          acreditation_type: '',
          attachments: null,
          imageDNI: data.personType === PersonTypeEnum.PN ? oFilePhoto : null,
          register_user_id: userId.toString(),
          created_at: Date.now(),
          create_user: Constants.USER_OWNER,
          status: Constants.STATUS_PENDING,
          user_id: userId,
          user_ids: [userId],
          full_name: tmpFullName,
          organization_name: organizationName != null ? organizationName : '',
          orgPol: data.orgPol,
          //electoralProcess_id: null,
          //statusCandidateElectoralProcess: null,
        };
        dataInbox['electoralProcess_id'] =
          data.electoralProcessId !== null &&
          data.electoralProcessId !== undefined &&
          data.electoralProcessId !== 'undefined'
            ? data.electoralProcessId
            : null;

        dataInbox['statusCandidateElectoralProcess'] = true;
      } else {
        dataInbox = {
          doc: data.doc,
          doc_type: data.docType,
          numeroPartida: numeroPartida,
          asientoRegistral: data.asientoRegistral,
          email: data.email,
          cellphone: data.cellphone,
          phone: data.phone,
          address: data.address,
          acreditation_type: '',
          attachments: null,
          imageDNI: data.personType === PersonTypeEnum.PN ? oFilePhoto : null,
          register_user_id: userId.toString(),
          created_at: Date.now(),
          create_user: Constants.USER_OWNER,
          status: Constants.STATUS_PENDING,
          user_id: userId,
          user_ids: [userId],
          full_name: tmpFullName,
          organization_name: organizationName != null ? organizationName : '',
          statusCandidateElectoralProcess: false,
          orgPol: data.orgPol,
        };
      }

      const resultInbox = await new this.inboxDocument(dataInbox).save();

      if (!resultInbox) {
        response.message = 'Error al guardar casilla';
        throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
      }

      //console.log("objeto inbox", resultInbox);
      inboxId = resultInbox._id;
      //console.log("inbox id", inboxId);

      let representativeId = null;
      if (data.personType === PersonTypeEnum.PJ) {
        rep.docType = rep.docType.toLowerCase();
        rep.email = rep.email.toLowerCase();

        //save file document
        // if (oFileDocument1 !== undefined) {
        //   oFileDocument1 = await this.copyFile(
        //     fileDocument1.buffer,
        //     'box/',
        //     decodeURIComponent(fileDocument1.originalname),
        //     rep.doc,
        //     Date.now(),
        //     false,
        //     false,
        //   );
        // }
        //
        // if (files.fileDocument2 !== undefined) {
        //   oFileDocument2 = await this.copyFile(
        //     fileDocument2.buffer,
        //     'box/',
        //     decodeURIComponent(fileDocument2.originalname),
        //     rep.doc,
        //     Date.now(),
        //     false,
        //     false,
        //   );
        // }

        if (fileBox1 !== undefined) {
          oFileBox1 = await this.copyFile(
            fileBox1.buffer,
            'box/',
            decodeURIComponent(fileBox1.originalname),
            rep.doc,
            Date.now(),
            false,
            false,
          );

          attachments.push(oFileBox1);
        }

        if (files.fileBox2 !== undefined) {
          oFileBox2 = await this.copyFile(
            fileBox2.buffer,
            'box/',
            decodeURIComponent(fileBox2.originalname),
            rep.doc,
            Date.now(),
            false,
            false,
          );
          attachments.push(oFileBox2);
        }

        const resultSaveRep = await this.representativeService.save(
          rep,
          oFileDocument1,
          oFileDocument2,
          oFilePhoto,
          oFileBox1,
          oFileBox2,
          userId,
          inboxId,
        );
        if (!resultSaveRep) {
          response.message = 'Los datos del representante no han sido guardados correctamente, por favor inténtelo más tarde.';
          throw new HttpException(response.message, HttpStatus.BAD_REQUEST);
        }

        representativeId = resultSaveRep.data._id;
        if(data.tes !== '{}'){
          const tes = JSON.parse(data.tes);
          await this.representativeService.saveOther(tes, userId, inboxId);
        }
        if(data.repre !== '{}'){
          const repre = JSON.parse(data.repre);
          await this.representativeService.saveOther(repre, userId, inboxId);
        }
        if(data.pres !== '{}'){
          const pres = JSON.parse(data.pres);
          await this.representativeService.saveOther(pres, userId, inboxId);
        }
        if(data.OP !== '{}'){
          const op = JSON.parse(data.OP);
          await this.representativeService.saveOther(op, userId, inboxId);
        }
        await this.inboxDocument.updateOne({ _id: inboxId }, { $set: { attachments: attachments } });
      }

      response.success = true;
      response.message = 'Solicitud enviada';
      if (data.personType === PersonTypeEnum.PJ) {
        response.data = {"inboxId": inboxId, "userId": userId, "repId": representativeId, "repEmail": rep.email, "repCellphone": rep.cellphone};
      } else {
        response.data = {"inboxId": inboxId, "userId": userId};
      }
      return response;
    } catch (err) {
      this.logger.error(
        JSON.stringify({
          message: 'error: create solicitude inbox',
          result: err,
        }),
      );
      response.message = err.message;
      throw new Error(err.message);
    }
  }

  validFile(file) {
    const signedFile = file.buffer;
    if (this.validatebyteFile(file.mimetype, signedFile)) {
      return true;
    }
    return false;
  }

  validatebyteFile(typeFile, signedFile) {
    switch (typeFile) {
      case 'application/pdf':
        return (
          Buffer.isBuffer(signedFile) && signedFile.lastIndexOf('%PDF-') === 0 && signedFile.lastIndexOf('%%EOF') > -1
        );
      case 'image/jpg':
      case 'image/jpeg':
        return /^(ffd8ffe([0-9]|[a-f]){1}$)/g.test(signedFile.toString('hex').substring(0, 8));
      case 'image/png':
        return signedFile.toString('hex').startsWith('89504e47');
      case 'image/bmp':
      case 'image/x-ms-bmp':
        return signedFile.toString('hex').startsWith('424d');
      default:
        return false;
    }
  }

  stringHash(text) {
    return cryptoJS.createHash('sha256').update(text).digest('hex');
  }

  getPath(prePath) {
    const _date = new Date(Date.now());
    const retorno = prePath + _date.getFullYear() + '/' + (_date.getMonth() + 1) + '/' + _date.getDate() + '/';

    return retorno;
  }

  async copyFile(Buffer, newPath, filename, doc, timestamp, isTmp, isBlocked) {
    const path_upload = process.env.PATH_UPLOAD;
    const path_upload_tmp = process.env.PATH_UPLOAD_TMP;
    try {
      const rawData = Buffer; //fs.readFileSync(oldPathFile);
      const pathAttachment = this.getPath(newPath);

      const stringHashNameFile = this.stringHash(
        cryptoJS.randomBytes(5).toString('hex') + '_' + doc + '_' + timestamp + '_' + filename,
      );

      const newPathFile = (isTmp ? path_upload_tmp : path_upload) + '/' + pathAttachment + stringHashNameFile;

      fs.mkdirSync((isTmp ? path_upload_tmp : path_upload) + '/' + pathAttachment, { recursive: true });

      fs.writeFileSync(newPathFile, rawData);

      return { path: pathAttachment + stringHashNameFile, name: filename, blocked: isBlocked };
    } catch (err) {
      console.log('ERROOOOOORR', err);
      return false;
    }
  }
}
