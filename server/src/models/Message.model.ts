import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId; receiverId: mongoose.Types.ObjectId;
  content: string; read: boolean; createdAt: Date;
}

const schema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ senderId: 1, receiverId: 1 });
export default mongoose.model<IMessage>('Message', schema);
