import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from "../schemas/user.schema";

export class UserService {
  constructor(
    @InjectModel(User.name)
    private userDocumentModel: Model<UserDocument>,
  ) {}

  async existeUsuarioConDoc(
    docType: string,
    docNumber: string,
    profile: string,
  ): Promise<boolean> {
    console.log('find user by:', docType, ' ', docNumber, 'and profile ', profile);
    const user = await this.userDocumentModel.findOne(
      {
        doc_type: docType,
        doc: docNumber,
        profile: profile,
      },
      {
        _id: 0,
        doc_type: 1,
        doc: 1,
        profile: 1,
      },
    );
    if (!user) {
      return false;
    }
    console.log('Ya existe el usuario con documento', user);
    return true;
  }

  async existeUsuarioConCorreo(
    correo: string,
    profile: string,
  ): Promise<boolean> {
    console.log('find user by email:', correo, 'and profile ', profile);
    const user = await this.userDocumentModel.findOne(
      {
        email: correo,
        profile: profile,
      },
      {
        _id: 0,
        doc_type: 1,
        doc: 1,
        profile: 1,
        email: 1,
      },
    );
    if (!user) {
      return false;
    }
    console.log('Ya existe el usuario con correo:', user);
    return true;
  }
}
