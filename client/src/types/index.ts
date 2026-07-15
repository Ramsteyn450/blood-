export type BloodType = 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-';
export type Gender = 'male'|'female'|'other';
export type RequestStatus = 'pending'|'accepted'|'rejected'|'completed';
export type UrgencyLevel = 'normal'|'urgent'|'critical';

export interface User {
  _id: string; name: string; email: string; phone: string;
  bloodType: BloodType; gender: Gender; profession: string;
  weight: number; takesTablets: boolean; eligible: boolean;
  isBanned: boolean; visibleOnMap: boolean; role: string;
  availabilityStatus: 'available' | 'busy' | 'offline';
  preferredLanguage: 'en' | 'ta' | 'hi';
  organizationName: string;
  location: { type: string; coordinates: [number,number] };
  lastDonationDate: string|null; nextEligibleDate: string|null;
  badges: number; avatar: string; state: string; district: string;
  bio: string; publicNote: string; emergencyAvailable: boolean;
  profileCompleted: boolean; lastActiveAt: string; createdAt: string; updatedAt: string;
}

export interface DonationRequest {
  _id: string; requesterId: User; donorId: User;
  bloodType: string; hospital: string; reason: string;
  urgencyLevel: UrgencyLevel; requiredUnits: number; contactNote: string;
  status: RequestStatus; acceptedAt: string|null; rejectedAt: string|null;
  completedAt: string|null; createdAt: string; updatedAt: string;
}

export interface Message {
  _id: string; senderId: User; receiverId: User;
  content: string; read: boolean; createdAt: string;
}

export interface CommunityMessage {
  _id: string; senderId: User; text: string;
  isAnnouncement: boolean; isUrgent: boolean; pinned: boolean; createdAt: string;
}

export interface Report {
  _id: string; reportedUserId: User; reportedBy: User;
  reason: string; reviewed: boolean; createdAt: string;
}

export interface AdminStats {
  totalUsers: number; activeDonors: number; ineligibleUsers: number;
  pendingRequests: number; acceptedRequests: number; totalDonations: number;
  totalReports: number; communityMessages: number; organizations: number;
}

export interface DonorStatus { status: RequestStatus; requestId: string; }

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface Appointment {
  _id: string;
  userId: User | string;
  donorId: User | string;
  organizationId: User | string;
  slotId: { timeSlot: string; date: string; capacity: number; booked: number; location: string } | string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  badgeAwarded: boolean;
  eligibilityCheckPassed: boolean;
  notes: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

