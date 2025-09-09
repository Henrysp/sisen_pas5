/**
 * Created by Alexander Llacho
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type RepresentativeDocument = Representative & Document;

export class File {
  path: string;
  name: string;
  blocked: boolean;
}

@Schema({ collection: 'representative', versionKey: false })
export class Representative {
  @Prop()
  doc_type: string;

  @Prop()
  doc: string;

  @Prop()
  asientoRegistralRep: string;
  
  @Prop()
  names: string;

  @Prop()
  lastname: string;

  @Prop()
  second_lastname: string;

  @Prop()
  email: string;

  @Prop()
  cellphone: string;

  @Prop()
  phone: string;

  @Prop()
  ubigeo: string;

  @Prop()
  address: string;

  @Prop()
  position: string;

  @Prop()
  position_name!: string;

  @Prop()
  document_type_attachment: string;

  @Prop()
  document_name_attachment!: string;

  @Prop()
  file_document1: File = new File();

  @Prop()
  file_document2: File = new File();

  @Prop()
  file_photo: File = new File();

  @Prop()
  file_box1: File = new File();

  @Prop()
  file_box2: File = new File();

  @Prop()
  enabled: boolean;

  @Prop()
  created_at: Date;

  @Prop()
  user_id: mongoose.Schema.Types.ObjectId;

  @Prop()
  inbox_id: mongoose.Schema.Types.ObjectId;

  @Prop()
  isAlternate: boolean;
}

export const RepresentativeSchema = SchemaFactory.createForClass(Representative);
