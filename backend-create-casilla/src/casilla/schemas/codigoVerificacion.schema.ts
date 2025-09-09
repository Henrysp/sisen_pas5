import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CodigoVerificacionDocument = CodigoVerificacion & Document;

@Schema({ collection: 'codigoVerificacion', versionKey: false })
export class CodigoVerificacion {
  @Prop()
  tipoDocumento: string;

  @Prop()
  numeroDocumento: string;

  @Prop()
  correoElectronico: string;

  @Prop()
  numeroCelular: string;

  @Prop()
  codigo: string;

  @Prop()
  fechaCreacion: Date;

  @Prop()
  validoHasta: Date;

  @Prop()
  intentosValidacion: number;

  @Prop()
  activo: boolean;

  @Prop()
  tipoServicio: string;
}

export const CodigoVerificacionSchema = SchemaFactory.createForClass(CodigoVerificacion);
