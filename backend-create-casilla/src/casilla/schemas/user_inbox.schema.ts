import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type userInboxDocument = UserInbox & Document;

@Schema({ collection: 'user_inbox', versionKey: false })
export class UserInbox {
  @Prop()
  doc: string;

  @Prop()
  doc_type: string;

  @Prop()
  profile: string;

  @Prop()
  user_id : mongoose.Schema.Types.ObjectId;

  @Prop()
  inbox_id : mongoose.Schema.Types.ObjectId;

  
}

export const UserInboxSchema = SchemaFactory.createForClass(UserInbox);
