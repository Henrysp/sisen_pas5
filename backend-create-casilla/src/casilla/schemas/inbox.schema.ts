import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type InboxDocument = Inbox & Document;

export class Archivo {
  path: string;
  name: string;
}

@Schema({ collection: 'inbox', versionKey: false })
export class Inbox {
  @Prop()
  doc: string;

  @Prop()
  doc_type: string;

  @Prop()
  numeroPartida: string;

  @Prop()
  asientoRegistralRep: string;

  @Prop()
  email: string;

  @Prop()
  cellphone: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  acreditation_type: string;

  @Prop()
  attachments: Archivo = new Archivo();

  @Prop()
  imageDNI: Archivo = new Archivo();

  @Prop()
  register_user_id: string;

  @Prop()
  created_at: Date;

  @Prop()
  create_user: string;

  @Prop()
  status: string;

  @Prop()
  user_id: mongoose.Schema.Types.ObjectId;

  @Prop()
  user_ids: [];

  @Prop()
  full_name: string;

  @Prop()
  organization_name: string;

  @Prop()
  filesGenerated: Archivo = new Archivo();

  @Prop()
  electoralProcess_id: string | null | undefined;

  @Prop()
  statusCandidateElectoralProcess: boolean | undefined;
}

export const InboxSchema = SchemaFactory.createForClass(Inbox);
