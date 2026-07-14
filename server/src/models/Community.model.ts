import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityMessage extends Document {
  senderId: mongoose.Types.ObjectId; text: string;
  isAnnouncement: boolean; isUrgent: boolean; pinned: boolean; createdAt: Date;
}

const schema = new Schema<ICommunityMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  isAnnouncement: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ createdAt: -1 });
export default mongoose.model<ICommunityMessage>('CommunityMessage', schema);
