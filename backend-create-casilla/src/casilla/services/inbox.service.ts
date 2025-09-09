import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MESSAGE } from '../common/message';
import { Inbox, InboxDocument } from '../schemas/inbox.schema';

export class InboxService {
  static readonly ESTADO_APROBADO = 'APROBADO';
  static readonly ESTADO_PENDIENTE = 'PENDIENTE';

  constructor(
    @InjectModel(Inbox.name)
    private inboxDocumentModel: Model<InboxDocument>,
  ) {}

  async existeCasilleroConDoc(docType: string, docNumber: string) {
    console.log('find casillero by:', docType, ' ', docNumber);
    const casilleroAprobado = await this.inboxDocumentModel.findOne(
      {
        doc_type: docType,
        doc: docNumber.toUpperCase(),
        $or: [{ status: InboxService.ESTADO_APROBADO }, { status: null }],
      },
      {
        _id: 0,
        doc_type: 1,
        doc: 1,
        status: 1,
      },
    );
    if (casilleroAprobado != null) {
      console.log('Ya existe el casillero aprobado/registrado con documento', casilleroAprobado);
      return {
        exist: true,
        message: MESSAGE.EXIST_INBOX,
      };
    }
    const casillerosPendientes = await this.inboxDocumentModel
      .find(
        {
          doc_type: docType,
          doc: docNumber.toUpperCase(),
          status: InboxService.ESTADO_PENDIENTE,
        },
        {
          _id: 0,
          doc_type: 1,
          doc: 1,
          status: 1,
        },
      )
      .count();
    if (casillerosPendientes > 0) {
      console.log('Ya existe más de un casillero aprobado/registrado con documento', casilleroAprobado);
      return {
        exist: true,
        message: 'Usted ya cuenta con una solicitud de registro de casilla electrónica pendiente de aprobación',
      };
    }
    return {
      exist: false,
    };
  }

  async existeCasilleroConCorreo(correo: string, docType: string, personType: string): Promise<boolean> {
    console.log('find casillero by email:', correo);
    const user = await this.inboxDocumentModel
      .findOne(
        {
          doc_type: {$in: ['dni', 'ce']},
          email: correo.toLowerCase(),
          $or: [{ status: InboxService.ESTADO_APROBADO }, { status: null }],
        },
        {
          _id: 0,
          doc_type: 1,
          doc: 1,
          status: 1,
          email: 1,
        },
      )
      .lean();

    if (!user) {
      return false;
    }

    if (personType === 'pj') {
      return false;
    }

    console.log('Ya existe el casillero con correo:', user);
    return true;
  }

  async existeCasilleroConCelular(celular: string, docType: string, personType: string): Promise<boolean> {
    console.log('find casillero by celular:', celular);
    const user = await this.inboxDocumentModel
      .findOne(
        {
          doc_type: {$in: ['dni', 'ce']},
          cellphone: celular.toLowerCase(),
          $or: [{ status: InboxService.ESTADO_APROBADO }, { status: null }],
        },
        {
          _id: 0,
          doc_type: 1,
          doc: 1,
          status: 1,
          cellphone: 1,
        },
      )
      .lean();

    if (!user) {
      return false;
    }

    if (personType === 'pj') {
      return false;
    }

    console.log('Ya existe el casillero con celular:', user);
    return true;
  }
}
