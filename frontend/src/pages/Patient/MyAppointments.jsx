import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    appointment_type: 'Follow-up Consultation',
    reason: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const patRes = await api.get('/patients');
      const activePat = patRes.data.data[0];
      
      if (activePat) {
        setProfile(activePat);
        const apptsRes = await api.get('/appointments');
        // Filter appointments for this patient
        setAppointments(apptsRes.data.data.filter(a => a.patient_id === activePat.id));
      }
    } catch (err) {
      setError('Failed to load appointments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.appointment_date || !formData.appointment_time) {
      return setError('Date and time are required.');
    }

    try {
      setError('');
      setSuccess('');
      const payload = {
        ...formData,
        patient_id: profile.id,
        dietitian_id: profile.dietitian_id // Assigns to their designated dietitian
      };

      const res = await api.post('/appointments', payload);
      if (res.data.success) {
        setSuccess('Consultation request submitted successfully.');
        setIsAddModalOpen(false);
        setFormData({
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:00 AM',
          appointment_type: 'Follow-up Consultation',
          reason: '',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">My Consultations & Appointments</h1>
          <p className="text-sm text-emerald-800/70">Track upcoming checkups and schedule consultations with your dietitian</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>Request Appointment</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Calendar className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No appointments scheduled</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Book a consultation session with your dietitian above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800/60">
                    <Clock className="h-4 w-4 text-emerald-700/50" />
                    <span>{appt.appointment_time} on {appt.appointment_date}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${appt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                    ${appt.status === 'Confirmed' ? 'bg-amber-50 text-amber-700 border border-amber-100' : ''}
                    ${appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : ''}
                    ${appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-100' : ''}
                  `}>
                    {appt.status}
                  </span>
                </div>

                <h3 className="font-bold text-emerald-950 text-sm">{appt.appointment_type}</h3>
                {appt.reason && <p className="text-xs text-emerald-900/60 leading-relaxed">Reason: {appt.reason}</p>}
              </div>

              <div className="flex items-center gap-2 border-t border-emerald-50 mt-4 pt-3 text-xs text-emerald-900/40">
                <Briefcase className="h-4 w-4 text-emerald-700/40" />
                <span>Dietitian: {appt.dietitian_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Request Consultation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    required
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Preferred Time *</label>
                  <input
                    type="text"
                    name="appointment_time"
                    required
                    value={formData.appointment_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                    placeholder="e.g. 10:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Consultation Purpose</label>
                <select
                  name="appointment_type"
                  value={formData.appointment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs"
                >
                  <option value="Follow-up Consultation">Diet Follow-up Consultation</option>
                  <option value="Diet Progress Review">Progress & Weight Review</option>
                  <option value="Symptom Checkup">Symptom checkup (Acidity/sinus/bloating)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Brief Description of Concerns</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs focus:ring-2"
                  placeholder="e.g. Feeling less bloated, weight has decreased slightly, want to adjust lunch schedule..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Submit Consultation Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyAppointments;
