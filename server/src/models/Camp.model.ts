import { Schema, model, Document, Types } from 'mongoose';

export interface ICamp extends Document {
  title: string;
  description: string;
  date: Date;
  time: string;
  place: string;
  hospital: string;
  doctors: string;
  campType: 'Blood Donation' | 'Eye Camp' | 'General Health' | 'Dental Camp' | 'Cardiology Camp';
  poster: string;
  locationName: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  organizerId: Types.ObjectId;
  rsvps: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CampSchema = new Schema<ICamp>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    place: { type: String, default: '' },
    hospital: { type: String, default: '' },
    doctors: { type: String, default: '' },
    campType: { type: String, enum: ['Blood Donation', 'Eye Camp', 'General Health', 'Dental Camp', 'Cardiology Camp'], default: 'Blood Donation' },
    poster: { type: String, default: '' },
    locationName: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rsvps: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

CampSchema.index({ location: '2dsphere' });

export default model<ICamp>('Camp', CampSchema);
