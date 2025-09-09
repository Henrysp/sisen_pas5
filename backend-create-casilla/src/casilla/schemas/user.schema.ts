import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users', versionKey: false })
export class User {
  @Prop()
  doc: string;

  @Prop()
  doc_type: string;

  @Prop()
  profile: string;

  @Prop()
  password: string;

  @Prop()
  password_old: string;

  @Prop()
  name: string;

  @Prop()
  lastname: string;

  @Prop()
  second_lastname: string;

  @Prop()
  numeroPartida: string;

  @Prop()
  asientoRegistral: string;

  @Prop()
  email: string;

  @Prop()
  cellphone: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  organization_name: string;

  @Prop()
  Ubigeo: string;

  @Prop()
  PaginaWeb: string;

  @Prop()
  register_user_id: string;

  @Prop()
  created_at: Date;

  @Prop()
  updated_password: boolean;

  @Prop()
  create_user: string;

  @Prop()
  status: string;

  @Prop()
  orgPol: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
