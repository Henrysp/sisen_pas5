import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';

export type EventHistoryDocument =  EventHistory & Document;

@Schema({ collection: 'event_history', versionKey: false })
export class EventHistory {
  @Prop()
  event: string;

  @Prop()
  collectionName: string;

  @Prop()
  id: mongoose.Schema.Types.ObjectId;

  @Prop()
  idUsuario: mongoose.Schema.Types.ObjectId;

  @Prop()
  idRepresentante: mongoose.Schema.Types.ObjectId;

  @Prop()
  sent_to: string;

  @Prop()
  status: boolean;

  @Prop()
  motivo: string;

  @Prop()
  date: Date;
}

export const EventHistorySchema = SchemaFactory.createForClass(EventHistory);
