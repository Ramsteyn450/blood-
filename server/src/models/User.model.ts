import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string; email: string; password: string; phone: string;
  bloodType: string; gender: string; profession: string; weight: number;
  takesTablets: boolean; eligible: boolean; isBanned: boolean; visibleOnMap: boolean;
  role: string;
  location: { type: string; coordinates: [number, number] };
  lastDonationDate: Date | null; nextEligibleDate: Date | null;
  badges: number; avatar: string; state: string; district: string;
  bio: string; publicNote: string; emergencyAvailable: boolean; profileCompleted: boolean;
  lastActiveAt: Date; createdAt: Date; updatedAt: Date;
  comparePassword(pw: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  bloodType: { type: String, required: true, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  gender: { type: String, required: true, enum: ['male','female','other'] },
  profession: { type: String, required: true },
  weight: { type: Number, required: true },
  takesTablets: { type: Boolean, default: false },
  eligible: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  visibleOnMap: { type: Boolean, default: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] },
  },
  lastDonationDate: { type: Date, default: null },
  nextEligibleDate: { type: Date, default: null },
  badges: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  publicNote: { type: String, default: '', maxlength: 200 },
  emergencyAvailable: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function(next) {
  if (this.weight < 50 || this.takesTablets) {
    this.eligible = false;
  } else {
    const today = new Date();
    if (!this.nextEligibleDate || this.nextEligibleDate <= today) this.eligible = true;
  }
  next();
});

userSchema.methods.comparePassword = function(pw: string) { return bcrypt.compare(pw, this.password); };
userSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };

export default mongoose.model<IUser>('User', userSchema);
