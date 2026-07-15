import mongoose, { Document, Schema } from 'mongoose';

export interface IDonationSlot extends Document {
  organizationId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD'
  timeSlot: string; // '09:00 AM'
  capacity: number;
  booked: number;
  isOpen: boolean;
  location: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDonationSlot>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1, max: 500 },
  booked: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

schema.index({ organizationId: 1, date: 1 });
schema.index({ date: 1, timeSlot: 1, isOpen: 1 });

export default mongoose.model<IDonationSlot>('DonationSlot', schema);
