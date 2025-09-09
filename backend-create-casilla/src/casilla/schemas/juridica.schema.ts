import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JuridicaDocument = Juridica & Document;

@Schema()
export class Juridica {
  @Prop()
  tidoc: string;

  @Prop()
  nuruc: string;

  @Prop()
  derazon: string;

  @Prop()
  teleffijo: string;

  @Prop()
  nucelular: string;

  @Prop()
  email: string;

  @Prop()
  direccion: string;

  @Prop()
  esreg: string;
}

export const JuridicaSchema = SchemaFactory.createForClass(Juridica);
