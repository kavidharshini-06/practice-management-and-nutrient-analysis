import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Activity,
  FileText
} from 'lucide-react';

const STATUSES = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const initialFormState = {
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    appointment_type: 'Initial Consultation',
    reason: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({});

  const fetchAppointmentsAndPatients = async () => {
    try {
      setLoading(true);
      const [apptsRes, patientsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients')
      ]);

      if (apptsRes.data.success) {
        setAppointments(apptsRes.data.data);
      }
      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data);
      }
    } catch (err) {
      setError('Failed to fetch appointments or patient listings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsAndPatients();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      return setError('Patient, date, and time are required fields.');
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.post('/appointments', formData);
      if (res.data.success) {
        setSuccess('Appointment successfully scheduled.');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        fetchAppointmentsAndPatients();
      }
    } catch (err) {
      setError('Failed to schedule appointment.');
    }
  };

  const handleEditClick = (appt) => {
    setSelectedAppt(appt);
    setEditFormData({
      appointment_date: appt.appointment_date || appt.APPOINTMENT_DATE,
      appointment_time: appt.appointment_time || appt.APPOINTMENT_TIME,
      appointment_type: appt.appointment_type || appt.APPOINTMENT_TYPE,
      status: appt.status || appt.STATUS,
      reason: appt.reason || appt.REASON || '',
      notes: appt.notes || appt.NOTES || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/appointments/${selectedAppt.id}`, editFormData);
      if (res.data.success) {
        setSuccess('Appointment status updated.');
        setIsEditModalOpen(false);
        fetchAppointmentsAndPatients();
      }
    } catch (err) {
      setError('Failed to update appointment details.');
    }
  };

  const handleDeleteClick = async (apptId) => {
    if (!window.confirm('Delete this scheduled appointment?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/appointments/${apptId}`);
      if (res.data.success) {
        setSuccess('Appointment deleted.');
        fetchAppointmentsAndPatients();
      }
    } catch (err) {
      setError('Failed to cancel/delete appointment.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Appointments & Visits</h1>
          <p className="text-sm text-emerald-800/70">Schedule and modify clinical consultations and progress checkups</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>Book Consultation</span>
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
          <CheckCircle2 className="h-5 w-5 animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      {/* Scheduler Dashboard */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Calendar className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No appointments scheduled</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Book a consultation above to start managing calendars.</p>
        </div>
      ) : (
        <div className="bg-white border border-emerald-900/5 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-900/5 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Schedule Date & Time</th>
                  <th className="px-6 py-4">Session Type / Goal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/5 text-sm text-emerald-950">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-emerald-50/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-emerald-950">{appt.patient_name}</p>
                        <p className="text-[10px] text-emerald-900/50 mt-0.5">{appt.patient_phone || appt.patient_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-emerald-850">
                        <Clock className="h-4 w-4 text-emerald-700/60" />
                        <div>
                          <p className="font-bold">{appt.appointment_time}</p>
                          <p className="text-[10px] text-emerald-900/50">{appt.appointment_date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-emerald-950">{appt.appointment_type}</p>
                        {appt.reason && <p className="text-xs text-emerald-900/60 mt-0.5 line-clamp-1">{appt.reason}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${appt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                        ${appt.status === 'Confirmed' ? 'bg-amber-50 text-amber-700 border border-amber-100' : ''}
                        ${appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : ''}
                        ${appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-100' : ''}
                      `}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(appt)}
                        className="inline-flex p-2 rounded-lg text-emerald-850 hover:bg-emerald-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(appt.id)}
                        className="inline-flex p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Book Consultation</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Select Patient *</label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                >
                  <option value="">Select Patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} (PAT-0{p.id})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Date *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Time *</label>
                  <input
                    type="text"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                    placeholder="e.g. 10:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Appointment Type</label>
                <select
                  name="appointment_type"
                  value={formData.appointment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs"
                >
                  <option value="Initial Consultation">Initial Consultation</option>
                  <option value="Follow-up Consultation">Follow-up Consultation</option>
                  <option value="Diet Progress Review">Diet Progress Review</option>
                  <option value="Prakriti Assessment">Prakriti Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Reason / Notes</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs focus:ring-2"
                  placeholder="Sluggish digestion concerns, weight logs..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Schedule Visit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Modify Consultation Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Reschedule Date</label>
                  <input
                    type="date"
                    value={editFormData.appointment_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Time</label>
                  <input
                    type="text"
                    value={editFormData.appointment_time || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Status</label>
                <select
                  value={editFormData.status || 'Scheduled'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Type</label>
                <input
                  type="text"
                  value={editFormData.appointment_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, appointment_type: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Practitioner Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs focus:ring-2"
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

export default Appointments;
