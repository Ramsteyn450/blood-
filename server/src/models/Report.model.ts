import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  reportedUserId: mongoose.Types.ObjectId; reportedBy: mongoose.Types.ObjectId;
  reason: string; reviewed: boolean; createdAt: Date;
}

const schema = new Schema<IReport>({
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  reviewed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IReport>('Report', schema);
