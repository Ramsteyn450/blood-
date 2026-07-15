import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_completed'
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'emergency_alert'
  | 'emergency_accepted'
  | 'donation_reminder'
  | 'badge_awarded'
  | 'message';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  actionUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'request_received','request_accepted','request_rejected','request_completed',
      'appointment_booked','appointment_confirmed','appointment_cancelled','appointment_completed',
      'emergency_alert','emergency_accepted','donation_reminder','badge_awarded','message'
    ],
    required: true 
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
}, { timestamps: true });

schema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', schema);
