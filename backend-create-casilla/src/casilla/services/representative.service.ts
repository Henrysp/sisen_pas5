import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { IGenericResponse } from '../dto/generic';
import { Representative, RepresentativeDocument } from '../schemas/representative.schema';
import { Inbox, InboxDocument } from '../schemas/inbox.schema';
import { MESSAGE } from '../common/message';

export class RepresentativeService {
  private readonly logger = new Logger(RepresentativeService.name);

  constructor(
    @InjectModel(Representative.name)
    private representativeDocument: Model<RepresentativeDocument>,
    @InjectModel(Inbox.name)
    private inboxDocumentModel: Model<InboxDocument>,
  ) {}

  async findByDoc(data: any): Promise<any> {
    const response: IGenericResponse<any> = {
      success: false,
    };

    let resultInbox: any = [];

    const resultRep = await this.representativeDocument.find(
      { doc_type: data.docType, doc: data.doc },
      {
        _id: 0,
        doc: 1,
        doc_type: 1,
        name: 1,
        user_id: 1,
        inbox_id: 1,
      },
    );

    if (resultRep.length > 0) {
      resultInbox = await this.inboxDocumentModel.find(
        {
          doc_type: 'ruc',
          doc: data.ruc,
          status: {$nin: ['DESAPROBADO', 'DESHABILITADO']}
        },
        {
          _id: 1,
          doc_type: 1,
          doc: 1,
          status: 1,
        },
      );

      let isApproved = false;
      let countPending = 0;

      for (const rep of resultRep) {
        for (const inbox of resultInbox) {
          if (rep.inbox_id.toString() === inbox._id.toString() && inbox.doc === data.ruc) {
            switch (inbox.status) {
              case 'APROBADO': {
                isApproved = true;
                response.message = MESSAGE.EXIST_INBOX;
                break;
              }

              case 'PENDIENTE': {
                countPending++;
                response.success = true;
                response.message = MESSAGE.EXIST_SOLICITUDE;
                break;
              }
            }
            break;
          }
        }

        if (isApproved || countPending > 1 || resultInbox.length === 0) {
          break;
        }
      }

      if (countPending > 1) {
        response.success = false;
        response.message = MESSAGE.EXIST_MORE_SOLICITUDE;
      }
    }

    if (resultRep.length === 0 || resultInbox.length === 0) {
      response.success = true;
      response.message = 'No tiene solicitudes pendientes';
    }

    return response;
  }

  async save(rep: any, oFileDocument1: any, oFileDocument2: any, oFilePhoto: any, oFileBox1: any, oFileBox2: any, userId: any, inboxId: any): Promise<any> {
    const response: IGenericResponse<any> = {
      success: false,
    };

    const createdAt = Date.now();

    const resultRep = await new this.representativeDocument({
      doc_type: rep.docType,
      doc: rep.doc,
      names: rep.names,
      lastname: rep.lastname,
      second_lastname: rep.second_lastname,
      email: rep.email,
      cellphone: rep.cellphone,
      phone: rep.phone,
      position: rep.position,
      position_name: rep.positionName,
      document_type_attachment: rep.documentTypeAttachment,
      document_name_attachment: rep.documentNameAttachment,
      file_document1: [oFileDocument1],
      file_document2: [oFileDocument2],
      file_photo: oFilePhoto,
      file_box1: [oFileBox1],
      file_box2: [oFileBox2],
      enabled: true,
      created_at: createdAt,
      user_id: userId,
      inbox_id: inboxId,
      ...(rep.alterno !== null && { isAlternate: rep.alterno }),
      ...(rep.asientoRegistralRep && { asientoRegistralRep: rep.asientoRegistralRep })
    }).save();

    if (resultRep) {
      response.success = true;
      response.data = resultRep._id;
    }

    return response;
  }

  async saveOther(rep: any, userId: any, inboxId: any): Promise<any> {
    const response: IGenericResponse<any> = {
      success: false,
    };

    const createdAt = Date.now();

    const resultRep = await new this.representativeDocument({
      doc_type: rep.docType,
      doc: rep.doc,
      names: rep.names,
      lastname: rep.lastname,
      second_lastname: rep.second_lastname,
      email: rep.email,
      cellphone: rep.cellphone,
      position: rep.position,
      position_name: rep.positionName,
      enabled: true,
      created_at: createdAt,
      user_id: userId,
      inbox_id: inboxId,
    }).save();

    if (resultRep) {
      response.success = true;
      response.data = resultRep._id;
    }

    return response;
  }

}
