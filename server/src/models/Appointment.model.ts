import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD'
  timeSlot: string; // '09:00 AM'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  completedAt: Date | null;
  cancelledAt: Date | null;
  badgeAwarded: boolean;
  eligibilityCheckPassed: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAppointment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: Schema.Types.ObjectId, ref: 'DonationSlot', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  badgeAwarded: { type: Boolean, default: false },
  eligibilityCheckPassed: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

schema.index({ userId: 1, date: 1 });
schema.index({ donorId: 1, date: 1 });
schema.index({ slotId: 1 });
schema.index({ organizationId: 1, date: 1 });

export default mongoose.model<IAppointment>('Appointment', schema);
