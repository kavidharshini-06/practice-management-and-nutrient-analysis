import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  Calendar, 
  FileText, 
  TrendingUp, 
  User, 
  Activity, 
  AlertCircle,
  Clock,
  Droplet,
  Compass,
  Edit2,
  X
} from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick profile update
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    phone: '',
    height: 170,
    weight: 70,
    allergies: '',
    dietary_restrictions: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch patient's clinical profile
      // Note: we can use a query mapping, in patients controller GET /patients returns list.
      // If user is role = patient, it filters by user_id inside the backend controller!
      const patListRes = await api.get('/patients');
      const patientRecord = patListRes.data.data[0]; // Active patient record
      
      if (patientRecord) {
        setProfile(patientRecord);
        setUpdateData({
          phone: patientRecord.phone || '',
          height: patientRecord.height || 170,
          weight: patientRecord.weight || 70,
          allergies: patientRecord.allergies || '',
          dietary_restrictions: patientRecord.dietary_restrictions || ''
        });

        // Fetch dietitian appointments
        const apptsRes = await api.get('/appointments');
        setAppointments(apptsRes.data.data.filter(a => a.patient_id === patientRecord.id));

        // Fetch dietitian plans
        const plansRes = await api.get('/diet-plans');
        setDietPlans(plansRes.data.data.filter(p => p.patient_id === patientRecord.id));
      }
    } catch (err) {
      setError('Failed to retrieve client clinical dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/patients/${profile.id}`, {
        ...profile,
        phone: updateData.phone,
        height: parseFloat(updateData.height),
        weight: parseFloat(updateData.weight),
        allergies: updateData.allergies,
        dietary_restrictions: updateData.dietary_restrictions
      });
      if (res.data.success) {
        setIsUpdateOpen(false);
        fetchData();
      }
    } catch (err) {
      alert('Failed to update details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  const activePlan = dietPlans.find(p => p.status === 'Active');
  const nextAppt = appointments.find(a => a.status === 'Scheduled' || a.status === 'Confirmed');

  return (
    <div className="p-6 space-y-6">
      
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Welcome, {user?.name}</h1>
          <p className="text-sm text-emerald-800/70">Your Ayurvedic Wellness Journey Portal</p>
        </div>
        <button
          onClick={() => setIsUpdateOpen(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md"
        >
          <Edit2 className="h-4 w-4" />
          <span>Update My Stats</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Prakriti Body Type Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">My Ayurvedic Prakriti</span>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {profile?.prakriti || 'Vata'}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{profile?.prakriti || 'Vata'} Constitution</h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              {profile?.prakriti?.includes('Vata') && 'Your constitution is dominated by air and ether elements. Focus on warm, moist, grounding meals with sweet, sour, and salty tastes to maintain balance.'}
              {profile?.prakriti?.includes('Pitta') && 'Your constitution is dominated by fire and water elements. Focus on cooling, heavy, sweet, and bitter meals. Avoid hot spices and sour ingredients.'}
              {profile?.prakriti?.includes('Kapha') && 'Your constitution is dominated by water and earth elements. Focus on warm, light, dry, and stimulating meals with pungent, bitter, and astringent tastes.'}
              {!profile?.prakriti && 'Review with your dietitian to assess your dosha configuration.'}
            </p>
          </div>
          
          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs">
            <span>Water Target: {profile?.water_intake || 2.0} L/day</span>
            <span>Sleep Target: {profile?.sleep_duration || 7.0} Hrs</span>
          </div>
        </div>

        {/* Active Diet Plan Panel */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-emerald-800" /> Active Diet Plan
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider px-2 py-0.5 rounded">Active</span>
            </div>

            {activePlan ? (
              <div className="space-y-2 text-xs text-emerald-950">
                <p className="font-bold">Goal: {activePlan.health_goal || 'General Health'}</p>
                <p className="text-emerald-900/60 leading-normal">Schedule: {activePlan.start_date} to {activePlan.end_date}</p>
                <p className="text-emerald-900/60 italic mt-2">"{activePlan.notes || 'Sip warm ginger water.'}"</p>
              </div>
            ) : (
              <p className="text-xs text-emerald-900/40 italic">No active diet plan assigned at the moment.</p>
            )}
          </div>

          {activePlan && (
            <button
              onClick={() => navigate(`/patient/diet-plans/view/${activePlan.id}`)}
              className="w-full text-center bg-emerald-850 hover:bg-emerald-800 text-white font-semibold text-xs py-2 rounded-xl mt-4"
            >
              Open Printable Daily Meal Plan
            </button>
          )}
        </div>

        {/* Next Scheduled Consult */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-amber-600" /> Next Consult
              </h3>
            </div>

            {nextAppt ? (
              <div className="space-y-2 text-xs text-emerald-950">
                <p className="font-bold text-emerald-850">{nextAppt.appointment_type}</p>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900/60">
                  <Clock className="h-4 w-4 text-emerald-700/50" />
                  <span>{nextAppt.appointment_time} on {nextAppt.appointment_date}</span>
                </div>
                <p className="text-emerald-900/60 mt-1">Reason: {nextAppt.reason || 'Follow-up'}</p>
              </div>
            ) : (
              <p className="text-xs text-emerald-900/40 italic">No upcoming consultations booked.</p>
            )}
          </div>

          <button
            onClick={() => navigate('/patient/appointments')}
            className="w-full text-center bg-white border border-emerald-900/10 text-emerald-950 hover:bg-emerald-50/50 font-semibold text-xs py-2 rounded-xl mt-4"
          >
            Manage Consultations
          </button>
        </div>

      </div>

      {/* Profile quick stats modal */}
      {isUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsUpdateOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Update My Biometrics</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={updateData.height}
                    onChange={(e) => setUpdateData({ ...updateData, height: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Weight (kg)</label>
                  <input
                    type="number" step="0.1"
                    value={updateData.weight}
                    onChange={(e) => setUpdateData({ ...updateData, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={updateData.phone}
                  onChange={(e) => setUpdateData({ ...updateData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Allergies</label>
                <input
                  type="text"
                  value={updateData.allergies}
                  onChange={(e) => setUpdateData({ ...updateData, allergies: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  placeholder="e.g. Peanuts, Dairy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Dietary Restrictions</label>
                <input
                  type="text"
                  value={updateData.dietary_restrictions}
                  onChange={(e) => setUpdateData({ ...updateData, dietary_restrictions: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  placeholder="e.g. Gluten-Free, Vegan"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
