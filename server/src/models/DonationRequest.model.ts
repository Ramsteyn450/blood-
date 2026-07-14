import mongoose, { Document, Schema } from 'mongoose';

export interface IDonationRequest extends Document {
  requesterId: mongoose.Types.ObjectId; donorId: mongoose.Types.ObjectId;
  bloodType: string; hospital: string; reason: string;
  urgencyLevel: string; requiredUnits: number; contactNote: string;
  status: string; acceptedAt: Date|null; rejectedAt: Date|null; completedAt: Date|null;
  createdAt: Date; updatedAt: Date;
}

const schema = new Schema<IDonationRequest>({
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, required: true },
  hospital: { type: String, required: true },
  reason: { type: String, required: true },
  urgencyLevel: { type: String, enum: ['normal','urgent','critical'], default: 'normal' },
  requiredUnits: { type: Number, default: 1 },
  contactNote: { type: String, default: '' },
  status: { type: String, enum: ['pending','accepted','rejected','completed'], default: 'pending' },
  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ requesterId: 1, donorId: 1, status: 1 });
export default mongoose.model<IDonationRequest>('DonationRequest', schema);
