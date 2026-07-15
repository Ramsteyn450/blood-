import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockDonors = [
  {
    name: 'Mock Donor Amit (Delhi)',
    email: 'mock.delhi1@example.com',
    password: 'password123',
    phone: '9999999901',
    bloodType: 'O+',
    gender: 'male',
    profession: 'Software Engineer',
    weight: 72,
    state: 'Delhi',
    district: 'New Delhi',
    location: { type: 'Point', coordinates: [77.2090, 28.6139] },
    bio: 'Happy to help in emergencies.',
    publicNote: 'Available 24/7 for O+ requests',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Priya (Delhi)',
    email: 'mock.delhi2@example.com',
    password: 'password123',
    phone: '9999999902',
    bloodType: 'B+',
    gender: 'female',
    profession: 'Doctor',
    weight: 58,
    state: 'Delhi',
    district: 'South Delhi',
    location: { type: 'Point', coordinates: [77.2167, 28.5333] },
    bio: 'Regular blood donor.',
    publicNote: 'Please contact via SMS first',
    emergencyAvailable: false
  },
  {
    name: 'Mock Donor Ramesh (Chennai)',
    email: 'mock.chennai1@example.com',
    password: 'password123',
    phone: '9999999903',
    bloodType: 'A+',
    gender: 'male',
    profession: 'Teacher',
    weight: 68,
    state: 'Tamil Nadu',
    district: 'Chennai',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    bio: 'Ready to donate.',
    publicNote: 'Available on weekends',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Sneha (Chennai)',
    email: 'mock.chennai2@example.com',
    password: 'password123',
    phone: '9999999904',
    bloodType: 'AB-',
    gender: 'female',
    profession: 'Student',
    weight: 54,
    state: 'Tamil Nadu',
    district: 'Chennai',
    location: { type: 'Point', coordinates: [80.2000, 13.0500] },
    bio: 'Rare blood group AB-. Always ready to donate.',
    publicNote: 'Urgent calls preferred',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Vikranth (Mumbai)',
    email: 'mock.mumbai1@example.com',
    password: 'password123',
    phone: '9999999905',
    bloodType: 'B-',
    gender: 'male',
    profession: 'Designer',
    weight: 75,
    state: 'Maharashtra',
    district: 'Mumbai',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    bio: 'First time donor, looking to help.',
    publicNote: 'Available after 6 PM',
    emergencyAvailable: false
  },
  {
    name: 'Mock Donor Aisha (Mumbai)',
    email: 'mock.mumbai2@example.com',
    password: 'password123',
    phone: '9999999906',
    bloodType: 'O-',
    gender: 'female',
    profession: 'Manager',
    weight: 60,
    state: 'Maharashtra',
    district: 'Mumbai',
    location: { type: 'Point', coordinates: [72.8258, 18.9220] },
    bio: 'Universal donor O-. Happy to help any time.',
    publicNote: 'Call for emergencies',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Karthik (Bangalore)',
    email: 'mock.bangalore1@example.com',
    password: 'password123',
    phone: '9999999907',
    bloodType: 'AB+',
    gender: 'male',
    profession: 'Consultant',
    weight: 80,
    state: 'Karnataka',
    district: 'Bangalore',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    bio: 'Active social worker.',
    publicNote: 'Ready to travel short distances to donate',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Pooja (Bangalore)',
    email: 'mock.bangalore2@example.com',
    password: 'password123',
    phone: '9999999908',
    bloodType: 'A-',
    gender: 'female',
    profession: 'HR',
    weight: 52,
    state: 'Karnataka',
    district: 'Bangalore',
    location: { type: 'Point', coordinates: [77.6413, 12.9784] },
    bio: 'Regular blood donor.',
    publicNote: 'Please drop a message',
    emergencyAvailable: false
  },
  {
    name: 'Mock Donor Harish (Hyderabad)',
    email: 'mock.hyderabad1@example.com',
    password: 'password123',
    phone: '9999999909',
    bloodType: 'O+',
    gender: 'male',
    profession: 'Engineer',
    weight: 74,
    state: 'Telangana',
    district: 'Hyderabad',
    location: { type: 'Point', coordinates: [78.4867, 17.3850] },
    bio: 'Donating for a better cause.',
    publicNote: 'Feel free to contact',
    emergencyAvailable: true
  },
  {
    name: 'Mock Donor Divya (Kochi)',
    email: 'mock.kochi1@example.com',
    password: 'password123',
    phone: '9999999910',
    bloodType: 'B+',
    gender: 'female',
    profession: 'Nurse',
    weight: 56,
    state: 'Kerala',
    district: 'Kochi',
    location: { type: 'Point', coordinates: [76.2673, 9.9312] },
    bio: 'Healthcare professional donating blood.',
    publicNote: 'Emergency blood donation support',
    emergencyAvailable: true
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
    console.log('Removing old mock donors...');
    const deleteResult = await User.deleteMany({ name: /^Mock Donor/ });
    console.log(`Removed ${deleteResult.deletedCount} old mock donors.`);

    // Insert new ones
    console.log('Inserting new mock donors...');
    for (const donor of mockDonors) {
      const u = new User(donor);
      await u.save();
    }
    console.log('Mock donors inserted successfully!');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

seed();
