import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User.model';
import DonationSlot from './models/DonationSlot.model';
import { format, addDays } from 'date-fns';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MOCK_DATA = [
  // ── ADMIN USER ─────────────────────────────────────────────────────────────
  {
    name: 'LifeFlow Admin',
    email: 'admin@lifeflow.com',
    password: 'admin123',
    phone: '9999999999',
    bloodType: 'O+',
    gender: 'male',
    profession: 'Administrator',
    weight: 75,
    state: 'Tamil Nadu',
    district: 'Chennai',
    role: 'admin',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    bio: 'LifeFlow central admin controller.',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150',
    publicNote: 'LifeFlow admin system support',
    emergencyAvailable: false,
    profileCompleted: true
  },

  // ── TAMIL NADU MOCK ORGANIZATIONS (HOSPITALS/BLOOD BANKS) ──────────────────
  {
    name: 'Trichy General Hospital & Blood Bank',
    organizationName: 'Trichy General Hospital',
    email: 'trichy.hospital@lifeflow.com',
    password: 'org123',
    phone: '9443210101',
    bloodType: 'O+',
    gender: 'male',
    profession: 'Medical Institution',
    weight: 70,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    role: 'organization',
    location: { type: 'Point', coordinates: [78.7047, 10.7905] }, // Trichy central
    bio: 'Pioneering healthcare service & blood donation drive coordinators in Tiruchirappalli district.',
    avatar: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=200', // Real hospital image
    publicNote: 'Open for blood collection drives daily 8 AM - 6 PM',
    emergencyAvailable: true,
    profileCompleted: true
  },
  {
    name: 'KMC Specialty Hospital Trichy',
    organizationName: 'KMC Hospital',
    email: 'kmc.trichy@lifeflow.com',
    password: 'org123',
    phone: '9443210102',
    bloodType: 'A+',
    gender: 'female',
    profession: 'Super Specialty Hospital',
    weight: 65,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    role: 'organization',
    location: { type: 'Point', coordinates: [78.6889, 10.8058] }, // Trichy Thillai Nagar
    bio: 'Specialty medical facility offering emergency blood storage and scheduled donation check-ins.',
    avatar: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200', // Real clinic image
    publicNote: 'Emergency blood bank operating 24/7',
    emergencyAvailable: true,
    profileCompleted: true
  },
  {
    name: 'Chennai Central Blood Bank',
    organizationName: 'Chennai Central Blood Center',
    email: 'chennai.blood@lifeflow.com',
    password: 'org123',
    phone: '9443210103',
    bloodType: 'O-',
    gender: 'male',
    profession: 'State Blood Bank',
    weight: 72,
    state: 'Tamil Nadu',
    district: 'Chennai',
    role: 'organization',
    location: { type: 'Point', coordinates: [80.2600, 13.0600] }, // Chennai
    bio: 'Largest blood storage facility in Chennai state supplying emergency blood to general hospitals.',
    avatar: 'https://images.unsplash.com/photo-1538108149393-fdfd8189ff9e?auto=format&fit=crop&q=80&w=200', // Hospital lobby
    publicNote: 'Check camps page for upcoming drives in metropolitan schools',
    emergencyAvailable: true,
    profileCompleted: true
  },
  {
    name: 'Coimbatore Red Cross Society',
    organizationName: 'Coimbatore Red Cross',
    email: 'coimbatore.redcross@lifeflow.com',
    password: 'org123',
    phone: '9443210104',
    bloodType: 'B+',
    gender: 'female',
    profession: 'Humanitarian Org',
    weight: 60,
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    role: 'organization',
    location: { type: 'Point', coordinates: [76.9616, 11.0168] }, // Coimbatore
    bio: 'Coimbatore red cross blood storage facility supporting neighboring taluks.',
    avatar: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200', // Lab room
    publicNote: 'Regular general health checks offered at zero cost',
    emergencyAvailable: false,
    profileCompleted: true
  },
  {
    name: 'Madurai Apollo Specialty Clinic',
    organizationName: 'Madurai Apollo Clinic',
    email: 'madurai.apollo@lifeflow.com',
    password: 'org123',
    phone: '9443210105',
    bloodType: 'AB+',
    gender: 'male',
    profession: 'Multi Specialty Center',
    weight: 80,
    state: 'Tamil Nadu',
    district: 'Madurai',
    role: 'organization',
    location: { type: 'Point', coordinates: [78.1198, 9.9252] }, // Madurai
    bio: 'Madurai Apollo branch coordinating scheduled donation slots and ambulance check-ins.',
    avatar: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=200', // Doctors team
    publicNote: 'Blood donor check-ins require profile QR verification',
    emergencyAvailable: true,
    profileCompleted: true
  },

  // ── TAMIL NADU MOCK DONORS (TRICHY & CHENNAI) ──────────────────────────────
  {
    name: 'Tamil Donor Siva (Trichy)',
    email: 'siva@lifeflow.com',
    password: 'user123',
    phone: '9003410101',
    bloodType: 'O+',
    gender: 'male',
    profession: 'Teacher',
    weight: 68,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    role: 'user',
    location: { type: 'Point', coordinates: [78.6900, 10.7850] },
    bio: 'Ready to support Trichy hospital blood bank.',
    avatar: '',
    publicNote: 'Always available on weekends',
    emergencyAvailable: true,
    profileCompleted: true
  },
  {
    name: 'Tamil Donor Anjali (Trichy)',
    email: 'anjali@lifeflow.com',
    password: 'user123',
    phone: '9003410102',
    bloodType: 'B-',
    gender: 'female',
    profession: 'Student',
    weight: 54,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    role: 'user',
    location: { type: 'Point', coordinates: [78.7120, 10.8120] },
    bio: 'Active volunteer at college campaigns.',
    avatar: '',
    publicNote: 'Rare B- donor',
    emergencyAvailable: true,
    profileCompleted: true
  },
  {
    name: 'Tamil Donor Vignesh (Chennai)',
    email: 'vignesh@lifeflow.com',
    password: 'user123',
    phone: '9003410103',
    bloodType: 'AB-',
    gender: 'male',
    profession: 'Accountant',
    weight: 71,
    state: 'Tamil Nadu',
    district: 'Chennai',
    role: 'user',
    location: { type: 'Point', coordinates: [80.2200, 13.0400] },
    bio: 'Regular donor.',
    avatar: '',
    publicNote: 'SMS or call anytime',
    emergencyAvailable: false,
    profileCompleted: true
  }
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined in the environment.');
      process.exit(1);
    }
    
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Clear existing mock users
    console.log('Removing old mock/seeded records...');
    await User.deleteMany({ email: { $in: MOCK_DATA.map(d => d.email) } });
    await User.deleteMany({ name: /^Mock Donor/ });

    console.log('Inserting Tamil Nadu organizations, admin, and donors...');
    const insertedUsers = [];
    for (const d of MOCK_DATA) {
      const u = new User(d);
      await u.save();
      insertedUsers.push(u);
    }
    console.log('Users inserted.');

    // Seed slots for the next 7 days for all organizations
    console.log('Clearing old donation slots...');
    const orgIds = insertedUsers.filter(u => u.role === 'organization').map(u => u._id);
    await DonationSlot.deleteMany({ organizationId: { $in: orgIds } });

    console.log('Generating active slots for all organizations...');
    const defaultSlots = ['09:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'];
    
    for (const orgId of orgIds) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const slotDate = format(addDays(new Date(), dayOffset), 'yyyy-MM-dd');
        for (const timeSlot of defaultSlots) {
          const ds = new DonationSlot({
            organizationId: orgId,
            date: slotDate,
            timeSlot: timeSlot,
            capacity: 15,
            booked: 0,
            isOpen: true,
            location: 'Main Block, Ground Floor',
            notes: 'Please bring your LifeFlow Donor ID Card.'
          });
          await ds.save();
        }
      }
    }
    console.log('Successfully generated slots for next 7 days!');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

seed();
