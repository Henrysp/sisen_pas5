import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';

import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';

import { Model } from 'mongoose';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';

import { PersonTypeEnum } from '../common/enums/personTypeEnum';

import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Inbox, InboxDocument } from '../schemas/inbox.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Representative, RepresentativeDocument } from '../schemas/representative.schema';

import { TimeStampingAgentService } from './timeStampAgent.service';
import { ElectoralProcess } from '../schemas/electoralProcess.schema';

const instanceHandlebars = allowInsecurePrototypeAccess(Handlebars);

@Injectable()
export class PdfManagerService {
  dataForTemplate: any = {};

  fileNameDownload = '';
  fileNameHash = '';
  fileName = '';
  path = '';
  tempFileName = '';
  tempPath = '';

  constructor(
    @InjectModel(Inbox.name)
    private inboxDocumentModel: Model<InboxDocument>,

    @InjectModel(User.name)
    private userDocument: Model<UserDocument>,

    @InjectModel(Representative.name)
    private representativeDocument: Model<RepresentativeDocument>,

    private readonly timeStampingAgentService: TimeStampingAgentService,

    @InjectModel(ElectoralProcess.name)
    private readonly electoralProcessModel: Model<ElectoralProcess>,
  ) {}

  async generatePdf(type: string, inboxId: string): Promise<Buffer> {
    const dataInbox = await this.getInbox(type, inboxId);
    this.processDataForTemplate(type, dataInbox);

    const browser = await this.launchBrowser();

    const page = await browser.newPage();
    const content = await this.compile('JAACTD-Formulario-de-Solicitud', this.dataForTemplate);
    await page.setContent(content);
    await page.emulateMediaType('screen');
    //const file = await this.generateFileName(dataInbox.doc_type, dataInbox.doc);
    const file = await this.generatePathFileNameTemp(dataInbox.doc_type, dataInbox.doc);

    const pdf = await page.pdf({
      //format: "A4",
      // verificar si el archivo pdf existe sino arrojará un error
      //path: `${process.env.PATH_UPLOAD}/${file.path}`,
      path: `${this.tempPath}/${this.tempFileName}`,
      landscape: true, // default false
      printBackground: true,
      preferCSSPageSize: true,
      scale: 0.95, // 1.2mi 1.3  1.4 max  *// min 0.94 max 0.945
      margin: {
        // Esto se reemplaza por los margenes pasados en los estilos css @page
        left: '59.5px',
        top: '8.25px',
        right: '40.0px',
        bottom: '58.05px',
      },
    });

    await browser.close();

    this.saveFileName(inboxId, file.path, file.fileName);
    this.fileName = file.fileName;

    //Guardar temporalmente
    //Realizar la consulta a la API sellado de tiempo
    await this.timeStampingPdf();
    //Realizar el guardado del archivo firmado
    //return pdf; // return pdf firmado
    return this.getPdf(); // return pdf firmado
  }

  textDocTypeView(doc: string, doc_type: string) {
    return <string>(doc + ' (' + doc_type + ') ').toUpperCase();
  }

  async launchBrowser() {
    try {
      return await puppeteer.launch({
        headless: 'new',
        defaultViewport: {
          width: 1000,
          height: 2500,
          //deviceScaleFactor: 1,
          //isMobile: true,
          hasTouch: false,
          isLandscape: false,
        },
      });
    } catch (e) {
      console.info('Unable to launch browser mode in sandbox mode. Lauching Chrome without sandbox.');

      return await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
        defaultViewport: {
          width: 1000,
          height: 2500,
          //deviceScaleFactor: 1,
          //isMobile: true,
          hasTouch: false,
          isLandscape: false,
        },
      });
    }
  }
  private stringHashNameFile = (text) => {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    this.tempFileName = hash;
    this.fileNameHash = hash;
    return hash;
  };

  async generateFileName(doc_type: string, nroDoc: string): Promise<any> {
    const today = new Date(Date.now());
    const subPath = `box/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    const path = `${process.env.PATH_UPLOAD}/${subPath}`;
    //const fileName = `Solicitud_de_Casilla_Electrónica_${type}_${nroDoc}.pdf`;
    const fileName = `Solicitud_de_Casilla_Electrónica_${doc_type.toUpperCase()}_${nroDoc}.pdf`;
    const stringHashNameFilevalue =
      crypto.randomBytes(5).toString('hex') + '_' + nroDoc + '_' + Date.now() + '_' + fileName;

    try {
      await fs.promises.access(path, fs.constants.F_OK);
    } catch (e) {
      // Si no existe se crea el directorio
      fs.mkdirSync(path, { recursive: true });
    }

    return {
      path: subPath + '/' + this.stringHashNameFile(stringHashNameFilevalue),
      fileName,
    };
  }
  async generatePathFileNameTemp(doc_type: string, nroDoc: string): Promise<any> {
    const today = new Date(Date.now());
    const subPath = `box/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    const tempPath = `${process.env.PATH_UPLOAD_TMP}/${subPath}`;
    const path = `${process.env.PATH_UPLOAD}/${subPath}`;
    const fileName = `Solicitud_de_Casilla_Electrónica_${doc_type.toUpperCase()}_${nroDoc}.pdf`;
    const stringHashNameFilevalue =
      crypto.randomBytes(5).toString('hex') + '_' + nroDoc + '_' + Date.now() + '_' + fileName;

    try {
      await fs.promises.access(tempPath, fs.constants.F_OK);
      this.tempPath = tempPath;
      this.path = path;
    } catch (e) {
      // Si no existe se crea el directorio
      fs.mkdirSync(tempPath, { recursive: true });
      this.tempPath = tempPath;
      this.path = path;
    }

    return {
      path: subPath + '/' + this.stringHashNameFile(stringHashNameFilevalue),
      fileName,
    };
  }

  private async processDataForTemplate(type: string, dataInbox: any): Promise<void> {
    // ... Lógica para procesar los datos según el tipo de persona
    if (!dataInbox) {
      throw new BadRequestException('Al argumento dataInbox debe ser válido');
    }
    const inboxId = dataInbox._id;
    const userUbigeo = await this.getUserUbigeo(dataInbox.user_id);

    const created_at = new Date(dataInbox._doc?.created_at);

    const date: any = {
      day: created_at.getDate(),
      month: created_at.getMonth() + 1,
      year: created_at.getFullYear(),
    };
    if (type === PersonTypeEnum.PN) {
      let personaFotoDni = '';
      let existPersonaFotoDni = false;

      try {
        //console.log('dataInbox._doc.imageDNI.path ', dataInbox._doc.imageDNI.path);
        const buffer = await this.getBufferFile(dataInbox._doc.imageDNI.path);
        personaFotoDni = await this.base64_encode(buffer);
        existPersonaFotoDni = true;
      } catch (e) {
        console.log('No se pudo cargar la imagen del DNI');
      }
      let electoralProcess = null;

      electoralProcess = await this.electoralProcessModel.findOne({
        _id: dataInbox.electoralProcess_id,
      });

      if (!dataInbox.statusCandidateElectoralProcess) {
        this.dataForTemplate = {
          type: {
            pn: true,
          },
          personaNatural: {
            ...this.transformToUpperCase(dataInbox._doc),
            textDoc: this.textDocTypeView(dataInbox._doc.doc, dataInbox._doc.doc_type),
            ubigeo: userUbigeo,
            electoralProcess: {
              statusCandidateElectoralProcessNo: true,
            },
            //fotoDni: personaFotoDni,
          },
          fotografia: {
            existe: existPersonaFotoDni,
            content: personaFotoDni,
          },
          date,
        };
      } else if (dataInbox.statusCandidateElectoralProcess) {
        this.dataForTemplate = {
          type: {
            pn: true,
          },
          personaNatural: {
            ...this.transformToUpperCase(dataInbox._doc),
            textDoc: this.textDocTypeView(dataInbox._doc.doc, dataInbox._doc.doc_type),
            ubigeo: userUbigeo,
            electoralProcess: {
              name: electoralProcess?.name ? electoralProcess.name?.toUpperCase() : '',
              statusCandidateElectoralProcessSi: dataInbox.statusCandidateElectoralProcess ? true : false,
              statusCandidateElectoralProcessNo: !dataInbox.statusCandidateElectoralProcess ? true : false,
            },
            //fotoDni: personaFotoDni,
          },
          fotografia: {
            existe: existPersonaFotoDni,
            content: personaFotoDni,
          },
          date,
        };
      } else {
        this.dataForTemplate = {
          type: {
            pn: true,
          },
          personaNatural: {
            ...this.transformToUpperCase(dataInbox._doc),
            textDoc: this.textDocTypeView(dataInbox._doc.doc, dataInbox._doc.doc_type),
            ubigeo: userUbigeo,
            //fotoDni: personaFotoDni,
          },
          fotografia: {
            existe: existPersonaFotoDni,
            content: personaFotoDni,
          },
          date,
        };
      }

      //console.log('existPersonaFotoDni ', existPersonaFotoDni);
    } else if (type === PersonTypeEnum.PJ) {
      const asientoRegistral = await this.getAsientoRegistral(dataInbox.user_id);
      const representative = await this.getRepresentative(dataInbox.user_id, inboxId);
      const representatives: any = {};

      const afiliadosOrgPolitica = await this.getRepresentatives(inboxId);
      const docTypePR = dataInbox._doc.doc_type === 'pr' ? true : false;
      const docTypeRUC = dataInbox._doc.doc_type === 'ruc' ? true : false;
      const personeroLegalTitular = representative.position_name === 'Personero Legal Titular' ? true : false;
      const representanteLegal = representative.position_name === 'Representante Legal' ? true : false;

      let personaFotoDni = '';
      let existPersonaFotoDni = false;
      try {
        //console.log('representative._doc.file_photo.path ', representative._doc.file_photo.path);
        const buffer = await this.getBufferFile(representative._doc.file_photo.path);
        personaFotoDni = await this.base64_encode(buffer);
        //console.log('personaFotoDni:', personaFotoDni);
        existPersonaFotoDni = true;
      } catch (e) {
        console.log('No se pudo cargar la imagen del DNI');
      }

      this.dataForTemplate = {
        type: {
          pj: true,
          docTypePR,
          docTypeRUC,
          personeroLegalTitular: personeroLegalTitular,
          representanteLegal: representanteLegal,
        },
        personaJuridica: {
          ...this.transformToUpperCase(dataInbox._doc),
          ubigeo: this.transformToUpperCase(userUbigeo),
          asientoRegistral: asientoRegistral.toUpperCase(),
        },
        fotografia: {
          existe: existPersonaFotoDni,
          content: personaFotoDni,
        },
        date,
      };
      if (representanteLegal) {
        this.dataForTemplate.personaJuridica.representative = {
          ...this.transformToUpperCase(representative._doc),
          textDoc: this.textDocTypeView(representative._doc.doc, representative._doc.doc_type),
        };
      }

      if (personeroLegalTitular && afiliadosOrgPolitica.length > 0) {
        afiliadosOrgPolitica.forEach((element) => {
          switch (element.position_name) {
            case 'Representante Legal':
            case 'Representante Legal OP':
              representatives.representanteLegal = this.transformToUpperCase(element._doc);
              representatives.representanteLegal.full_name = (
                element.names +
                ' ' +
                element.lastname +
                ' ' +
                element.second_lastname
              ).toUpperCase();
              representatives.representanteLegal.textDoc = this.textDocTypeView(
                element._doc.doc,
                element._doc.doc_type,
              );
              break;
            case 'Personero Legal Titular':
              representatives.personeroLegalTitular = this.transformToUpperCase(element._doc);
              representatives.personeroLegalTitular.full_name = (
                element.names +
                ' ' +
                element.lastname +
                ' ' +
                element.second_lastname
              ).toUpperCase();
              representatives.personeroLegalTitular.textDoc = this.textDocTypeView(
                element._doc.doc,
                element._doc.doc_type,
              );
              break;
            case 'Presidente':
              representatives.presidente = this.transformToUpperCase(element._doc);
              representatives.presidente.full_name = (
                element.names +
                ' ' +
                element.lastname +
                ' ' +
                element.second_lastname
              ).toUpperCase();
              representatives.presidente.textDoc = this.textDocTypeView(element._doc.doc, element._doc.doc_type);
              break;
            case 'Tesorero':
              representatives.tesorero = this.transformToUpperCase(element._doc);
              representatives.tesorero.full_name = (
                element.names +
                ' ' +
                element.lastname +
                ' ' +
                element.second_lastname
              ).toUpperCase();
              representatives.tesorero.textDoc = this.textDocTypeView(element._doc.doc, element._doc.doc_type);
              break;
            default:
              break;
          }
        });
        if (representative) {
          this.dataForTemplate.representatives = representatives;
          this.dataForTemplate.personaJuridica.representative = {
            ...this.transformToUpperCase(representative._doc),
            textDoc: this.textDocTypeView(representative._doc.doc, representative._doc.doc_type),
          };
        }
      }
    }
  }

  async saveFileName(inboxId: string, path: string, fileName: string): Promise<any> {
    const fileGenerated = [];
    fileGenerated.push({ path, fileName, name: fileName });
    await this.inboxDocumentModel.updateOne({ _id: inboxId }, { $set: { filesGenerated: fileGenerated } });
  }

  async compile(templateName: string, data: any) {
    const filePath = path.join(process.cwd(), 'template/pdf', `${templateName}.html`);
    const html = await fs.readFile(filePath, 'utf-8');
    return instanceHandlebars.compile(html)(data);
  }

  async getInbox(type: string, id: string): Promise<any> {
    const dataPn = await this.getDataInbox(id);

    if (!dataPn) {
      console.log('No se encontró el registro con el _id ' + id + ' en la collection inbox');
      throw new BadRequestException('No se encontró el registro con el _id ' + id + ' en la collection inbox');
    } else {
      return dataPn;
    }
  }

  async getDataInbox(inboxId) {
    const result = await this.inboxDocumentModel.findOne({
      _id: inboxId,
    });
    if (!result) {
      console.log('No existe el _id con el valor de ' + inboxId + ' en la collection inbox ');
      throw new BadRequestException('No existe el _id con el valor de ' + inboxId + ' en la collection inbox');
    } else {
      return result;
    }
  }

  async getUserUbigeo(userId) {
    if (!userId) {
      throw new NotFoundException('Se requiere que el argumento userId sea un valor válido');
    }
    const result = await this.userDocument.findOne({
      _id: userId,
    });
    if (!result.Ubigeo) {
      console.log('No se encontró el campo Ubigeo para el usuario con _id ' + userId);
      return false;
    }
    const ubigeo: Array<string> = result.Ubigeo.split('/');
    if (!result) {
      console.log('No se encontró un registro con el id ', userId);
      return false;
    } else {
      return {
        departamento: ubigeo[0],
        provincia: ubigeo[1],
        distrito: ubigeo[2],
      };
    }
  }
  async getAsientoRegistral(userId) {
    const result = await this.getUser(userId);
    const asientoRegistral = (result as any).asientoRegistral;
    if (!asientoRegistral) {
      console.log('_id: ' + userId + ' no contiene el campo asientoRegistral en la collection users');
      throw new NotFoundException('_id: ' + userId + ' no contiene el campo asientoRegistral en la collection users');
    }
    return asientoRegistral;
  }

  async getUser(userId) {
    const result = await this.userDocument.findOne({
      _id: userId,
    });
    if (!result) {
      console.log('No se encontró un registro con el id ' + userId + ' en la collection users');
      throw new NotFoundException('registro no encontrado para el _id : ' + userId + ' en la collection users');
    } else {
      return result;
    }
  }

  transformToUpperCase(data: any) {
    const transformed: any = {};

    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        const val: string = value as string;
        transformed[key] = val.toUpperCase();
      }
    }
    return transformed;
  }

  async getRepresentative(userId: string, inboxId: string): Promise<any> {
    const result = await this.representativeDocument.findOne({
      user_id: userId,
      inbox_id: inboxId,
    });

    if (!result) {
      console.log('No se encontró un registro con el id ' + userId + ' en la collection representative');
      return false;
    } else {
      return result;
    }
  }
  async getRepresentatives(inboxId: string): Promise<any> {
    const result = await this.representativeDocument.find({
      //user_id: userId,
      inbox_id: inboxId,
    });

    if (!result) {
      return false;
    } else {
      return result;
    }
  }

  getPdf(): Promise<Buffer> {
    const pathFile = `${this.path}/${this.fileNameHash}`;
    return fs.readFileSync(pathFile);
  }

  async getBufferFile(subPathFile: string) {
    const path = `${process.env.PATH_UPLOAD}/${subPathFile}`;
    const contenFile = fs.readFileSync(path);

    return contenFile;
  }

  async base64_encode(bufferFile): Promise<any> {
    const contentBase64 = Buffer.from(bufferFile).toString('base64');

    return contentBase64;
  }

  async getPdfGenerated(inboxId: string): Promise<Buffer> {
    const dataInbox = await this.inboxDocumentModel.findOne({ _id: inboxId });
    const path = dataInbox?.filesGenerated?.[0]?.path;
    if (!path) {
      throw new NotFoundException('No existe archivo generado para esta solicitud ', '404');
    }
    const fileName = dataInbox?.filesGenerated?.[0]?.fileName;
    this.fileName = fileName;
    const buffer = fs.readFileSync(path);
    return buffer;
  }

  async getPdfGeneratedById(inboxId: string): Promise<Buffer> {
    const dataInbox = await this.inboxDocumentModel.findOne({ _id: inboxId });
    const path = dataInbox.filesGenerated[0].path;
    const fileName = dataInbox.filesGenerated[0].fileName;
    this.fileName = fileName;

    const buffer = fs.readFileSync(path);
    return buffer;
  }

  async timeStampingPdf() {
    await this.timeStampingAgentService.signFile(this.tempPath, this.tempFileName, this.path, this.fileNameHash);
  }
}
