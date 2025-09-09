import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UbigeoDocument = Ubigeo & Document;

@Schema()
export class Ubigeo {
  @Prop()
  nodep: string;

  @Prop()
  noprv: string;

  @Prop()
  nodis: string;

  @Prop()
  ubdep: string;

  @Prop()
  ubprv: string;

  @Prop()
  ubdis: string;
}

export const UbigeoSchema = SchemaFactory.createForClass(Ubigeo);
