import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { User, Appointment } from '../types';
import { ShieldCheck, Heart, UserCheck, Calendar, Clock, Award, Building, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export default function VerifyDonorPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [donor, setDonor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState('');
  const [checkinError, setCheckinError] = useState('');

  const fetchDonorDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/users/profile/${id}`);
      setDonor(data.user);
      
      // Look up today's appointments for this donor
      const today = format(new Date(), 'yyyy-MM-dd');
      const apptRes = await api.get('/appointments/my'); // fallbacks/mock or org bookings
      // If we are logged in as organization, we can search in organization bookings
      if (currentUser?.role === 'organization') {
        const orgRes = await api.get('/appointments/org/bookings', { params: { date: today } });
        const matched = (orgRes.data.appointments || []).filter((a: Appointment) => 
          (typeof a.userId === 'object' ? a.userId?._id : a.userId) === id && a.status === 'confirmed'
        );
        setAppointments(matched);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorDetails();
  }, [id, currentUser]);

  const handleCheckin = async (apptId: string) => {
    setCheckingIn(true);
    setCheckinSuccess('');
    setCheckinError('');
    try {
      await api.patch(`/appointments/${apptId}/complete`);
      setCheckinSuccess('✓ Check-In complete! 1 Badge awarded successfully.');
      fetchDonorDetails();
    } catch {
      setCheckinError('Failed to complete check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner w-8 h-8" /></div>;
  if (!donor) return <div className="text-center py-16 text-gray-400">Donor not found. Please scan a valid QR code.</div>;

  const milestoneTitle = donor.badges >= 10 ? 'Blood Ambassador' : donor.badges >= 5 ? 'Life Saver' : donor.badges >= 1 ? 'First Drop Hero' : 'New Donor';

  return (
    <div className="max-w-md mx-auto px-4 py-8 page-enter space-y-6">
      
      {/* Back button */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blood-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Home
      </button>

      {/* Verification Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-4 border-emerald-50 shadow-md">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="font-display text-xl font-bold text-gray-800">LifeFlow Verified Donor</h1>
        <p className="text-xs text-gray-400">Authentic Donor Digital Credentials</p>
      </div>

      {/* Donor Card */}
      <div className="card p-5 border-t-4 border-t-blood-600 bg-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-lg">
            {donor.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm md:text-base">{donor.name}</h3>
            <p className="text-xs text-gray-400">{donor.email}</p>
          </div>
          <span className="ml-auto badge-blood text-sm px-2.5 py-1">{donor.bloodType}</span>
        </div>

        <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3 text-xs text-gray-600">
          <div>
            <p className="text-gray-400 font-bold">MILESTONE RANK</p>
            <p className="font-bold text-amber-600 mt-0.5">🏅 {milestoneTitle}</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold">TOTAL BADGES</p>
            <p className="font-bold text-amber-600 mt-0.5">{donor.badges} Donations</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold">GENDER / WEIGHT</p>
            <p className="font-medium text-gray-700 mt-0.5 capitalize">{donor.gender} / {donor.weight} kg</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold">LOCATION</p>
            <p className="font-medium text-gray-700 mt-0.5">{donor.district ? `${donor.district}, ` : ''}{donor.state}</p>
          </div>
        </div>

        {/* Eligibility Indicator */}
        <div className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${donor.eligible ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {donor.eligible ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {donor.eligible ? 'Verified Eligible to Donate Blood' : 'Currently Ineligible (90-day rest period or medical conditions)'}
        </div>
      </div>

      {/* check-in section for organization */}
      {currentUser?.role === 'organization' && (
        <div className="card p-5 border-blue-200 bg-blue-50/10 space-y-3">
          <h4 className="font-bold text-blue-700 text-xs uppercase tracking-wider flex items-center gap-1.5"><Building className="w-4 h-4" /> Hospital Check-in Action</h4>
          <p className="text-xs text-gray-400">Complete appointment validation for this donor below:</p>

          {checkinSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5"><CheckCircle className="w-4 h-4 flex-shrink-0" />{checkinSuccess}</div>}
          {checkinError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{checkinError}</div>}

          {appointments.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-200">
              ⚠️ No active confirmed appointments found for this donor at your hospital today.
            </p>
          ) : (
            appointments.map(appt => (
              <div key={appt._id} className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-700">Time Slot: {appt.timeSlot}</p>
                    <p className="text-gray-400">Date: {format(new Date(appt.date), 'MMM d, yyyy')}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg h-fit">Confirmed</span>
                </div>
                <button
                  disabled={checkingIn}
                  onClick={() => handleCheckin(appt._id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                >
                  {checkingIn ? <div className="spinner w-3.5 h-3.5" /> : <><UserCheck className="w-4 h-4" /> Confirm Check-In & Award Badge</>}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Guest/non-organization message */}
      {currentUser?.role !== 'organization' && (
        <p className="text-center text-xs text-gray-400 italic">
          Hospital staff: Log in to check-in this donor.
        </p>
      )}

    </div>
  );
}
