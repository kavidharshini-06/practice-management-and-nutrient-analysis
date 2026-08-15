import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  User, 
  Activity, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  FileText,
  AlertCircle,
  Clock,
  Heart,
  Droplet,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const PatientDetails = () => {
  const { id } = useParams(); // Patient ID
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Intake forms states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNewConsultOpen, setIsNewConsultOpen] = useState(false);
  const [isNewProgressOpen, setIsNewProgressOpen] = useState(false);

  // Edit Patient Form State
  const [editFormData, setEditFormData] = useState({});

  // New Consultation Form State
  const [newConsultData, setNewConsultData] = useState({
    consultation_date: new Date().toISOString().split('T')[0],
    concerns: '',
    assessment: '',
    recommendations: '',
    follow_up_date: '',
    notes: ''
  });

  // New Progress Record State
  const [newProgressData, setNewProgressData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    weight: '',
    water_intake: 2.0,
    exercise: '',
    adherence: 'High',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // Patient profile
      const patRes = await api.get(`/patients/${id}`);
      if (patRes.data.success) {
        setPatient(patRes.data.data);
        setEditFormData(patRes.data.data);
      }

      // Consultations
      const consRes = await api.get(`/consultations?patientId=${id}`);
      setConsultations(consRes.data.data);

      // Diet plans
      const plansRes = await api.get('/diet-plans');
      const filteredPlans = plansRes.data.data.filter(p => p.patient_id === parseInt(id));
      setDietPlans(filteredPlans);

      // Progress records
      const progRes = await api.get(`/progress/${id}`);
      setProgressRecords(progRes.data.data);

    } catch (err) {
      setError('Failed to fetch patient details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/patients/${id}`, editFormData);
      if (res.data.success) {
        setIsEditProfileOpen(false);
        fetchData();
      }
    } catch (err) {
      alert('Failed to update patient profile.');
    }
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newConsultData, patient_id: parseInt(id) };
      const res = await api.post('/consultations', payload);
      if (res.data.success) {
        setIsNewConsultOpen(false);
        setNewConsultData({
          consultation_date: new Date().toISOString().split('T')[0],
          concerns: '',
          assessment: '',
          recommendations: '',
          follow_up_date: '',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      alert('Failed to log consultation.');
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newProgressData, patient_id: parseInt(id) };
      const res = await api.post('/progress', payload);
      if (res.data.success) {
        setIsNewProgressOpen(false);
        setNewProgressData({
          record_date: new Date().toISOString().split('T')[0],
          weight: '',
          water_intake: 2.0,
          exercise: '',
          adherence: 'High',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      alert('Failed to log progress metrics.');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this diet plan?')) return;
    try {
      const res = await api.delete(`/diet-plans/${planId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete diet plan.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Patient profile not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-950">{patient.name}</h1>
            <p className="text-xs text-emerald-900/50">Patient ID: PAT-0{patient.id} • Registered under your care</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/dietitian/diet-plans/new', { state: { patient } })}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Diet Plan</span>
          </button>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-2 bg-white border border-emerald-900/10 text-emerald-950 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50/50 transition-all"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-emerald-900/5 overflow-x-auto gap-2">
        {[
          { id: 'profile', label: 'Clinical Profile', icon: User },
          { id: 'consultations', label: 'Consultations', icon: ClipboardList },
          { id: 'dietplans', label: 'Diet Plans', icon: FileText },
          { id: 'progress', label: 'Progress Charts', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'border-emerald-800 text-emerald-950' 
                  : 'border-transparent text-emerald-900/40 hover:text-emerald-950'}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bio info */}
            <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium md:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-emerald-950 mb-3 border-b border-emerald-100 pb-1">1. Clinical Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Date of Birth</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.date_of_birth || 'Not logged'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Gender</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.gender || 'Not logged'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Phone</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.phone || 'Not logged'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Email</span>
                    <p className="font-bold text-emerald-950 mt-0.5 break-all">{patient.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-emerald-950 mb-3 border-b border-emerald-100 pb-1">2. Health Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Allergies</span>
                    <p className="font-medium text-emerald-950 mt-0.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 inline-block w-full">
                      {patient.allergies || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Dietary Restrictions</span>
                    <p className="font-medium text-emerald-950 mt-0.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block w-full">
                      {patient.dietary_restrictions || 'None'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-emerald-900/40 font-semibold">Health Goals</span>
                    <p className="font-semibold text-emerald-950 mt-0.5 bg-emerald-50/30 px-3 py-2 rounded-lg border border-emerald-900/5">
                      {patient.health_goal || 'No goal set yet.'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-emerald-900/40 font-semibold">Current Diet & Lifestyle notes</span>
                    <p className="text-emerald-900/80 mt-1">{patient.current_diet || '—'}</p>
                    <p className="text-emerald-900/80 mt-1 text-xs italic">{patient.lifestyle_info || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ayurvedic Profile */}
            <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <h2 className="text-sm font-bold text-emerald-950">Ayurvedic Prakriti</h2>
                <span className="px-3 py-1 bg-emerald-800 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                  {patient.prakriti || 'Vata'}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-emerald-900/40 font-semibold">Rasa Preference (Tastes)</span>
                  <p className="font-bold text-emerald-950 mt-0.5">{patient.rasa_preference || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Sleep Duration</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.sleep_duration} Hrs/day</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Water Intake</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.water_intake} Liters/day</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Stress Level</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.stress_level || 'Medium'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900/40 font-semibold">Exercise level</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{patient.exercise_level || 'Moderate'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-900/40 font-semibold">Lifestyle & Assessment Notes</span>
                  <p className="text-xs text-emerald-900/80 bg-emerald-50/20 border border-emerald-900/5 p-3 rounded-xl mt-1 leading-relaxed">
                    {patient.lifestyle_notes || 'No assessment notes added yet.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Consultations */}
        {activeTab === 'consultations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h2 className="font-bold text-emerald-950">Consultation History</h2>
              <button
                onClick={() => setIsNewConsultOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Log consultation</span>
              </button>
            </div>

            {consultations.length === 0 ? (
              <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
                <ClipboardList className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
                <h3 className="text-emerald-950 font-semibold">No consultations recorded</h3>
                <p className="text-sm text-emerald-800/50 mt-1">Log the first patient visit details above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((cons) => (
                  <div key={cons.id} className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                      <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(cons.consultation_date).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                      </div>
                      {cons.follow_up_date && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold">
                          Follow-up: {new Date(cons.follow_up_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-emerald-900/40 font-bold uppercase tracking-wider">Patient Concerns</span>
                        <p className="text-emerald-950 font-medium mt-1 leading-relaxed">{cons.concerns}</p>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-900/40 font-bold uppercase tracking-wider">Dosha Assessment</span>
                        <p className="text-emerald-950 font-medium mt-1 leading-relaxed">{cons.assessment}</p>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-900/40 font-bold uppercase tracking-wider">Dietary Recommendations</span>
                        <p className="text-emerald-950 font-semibold mt-1 leading-relaxed text-emerald-800">{cons.recommendations}</p>
                      </div>
                    </div>

                    {cons.notes && (
                      <div className="text-xs text-emerald-900/60 bg-emerald-50/20 p-3 rounded-lg border border-emerald-900/5">
                        <strong className="text-emerald-950">Dietitian Notes:</strong> {cons.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Diet plans */}
        {activeTab === 'dietplans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h2 className="font-bold text-emerald-950">Diet Plans History</h2>
              <button
                onClick={() => navigate('/dietitian/diet-plans/new', { state: { patient } })}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Build Diet Plan</span>
              </button>
            </div>

            {dietPlans.length === 0 ? (
              <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
                <FileText className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
                <h3 className="text-emerald-950 font-semibold">No diet plans created</h3>
                <p className="text-sm text-emerald-800/50 mt-1">Build the first diet plan for this patient.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dietPlans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800/50 font-semibold">
                          <Clock className="h-4 w-4" />
                          <span>{plan.start_date} to {plan.end_date}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${plan.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}
                        `}>
                          {plan.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-emerald-950 text-sm">Goal: {plan.health_goal || 'General Health'}</h3>
                      {plan.notes && <p className="text-xs text-emerald-900/60 line-clamp-2">{plan.notes}</p>}
                    </div>

                    <div className="flex items-center justify-between border-t border-emerald-50 mt-4 pt-3">
                      <button
                        onClick={() => navigate(`/dietitian/diet-plans/view/${plan.id}`)}
                        className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Details & Print</span>
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Progress Charts */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h2 className="font-bold text-emerald-950">Biometric Progress Tracking</h2>
              <button
                onClick={() => setIsNewProgressOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Log Progress Entry</span>
              </button>
            </div>

            {progressRecords.length === 0 ? (
              <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
                <TrendingUp className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
                <h3 className="text-emerald-950 font-semibold">No progress data logged</h3>
                <p className="text-sm text-emerald-800/50 mt-1">Record weight and metrics above to render progress lines.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Recharts Chart */}
                <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium xl:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 mb-4">Weight Profile (kg)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressRecords}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="record_date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                        <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 3', 'dataMax + 3']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Logs list */}
                <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium max-h-[390px] overflow-y-auto space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-2">Logged Entries</h3>
                  {progressRecords.map((rec) => (
                    <div key={rec.id} className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-900/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-emerald-950">Weight: {rec.weight} kg</p>
                        <p className="text-[10px] text-emerald-900/40 mt-0.5">{rec.record_date}</p>
                        {rec.adherence && (
                          <p className="text-[10px] font-semibold text-emerald-700 mt-1">Adherence: {rec.adherence}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">BMI: {rec.bmi}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* Profile Edit Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative border border-emerald-900/5 my-8">
            <button 
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Edit Clinical Profile</h2>
            <form onSubmit={handleProfileUpdateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Full Name</label>
                  <input
                    type="text" required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editFormData.height || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, height: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Weight (kg)</label>
                  <input
                    type="number" step="0.1"
                    value={editFormData.weight || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Prakriti (Ayurvedic Constitution)</label>
                  <select
                    value={editFormData.prakriti || 'Vata'}
                    onChange={(e) => setEditFormData({ ...editFormData, prakriti: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  >
                    {['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Water Intake Target (Liters)</label>
                  <input
                    type="number" step="0.5"
                    value={editFormData.water_intake || 2.0}
                    onChange={(e) => setEditFormData({ ...editFormData, water_intake: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Allergies</label>
                  <input
                    type="text"
                    value={editFormData.allergies || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Dietary Restrictions</label>
                  <input
                    type="text"
                    value={editFormData.dietary_restrictions || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dietary_restrictions: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Health Goal</label>
                  <textarea
                    value={editFormData.health_goal || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, health_goal: e.target.value })} rows="2"
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Prakriti & Lifestyle Notes</label>
                  <textarea
                    value={editFormData.lifestyle_notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lifestyle_notes: e.target.value })} rows="3"
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Consultation Modal */}
      {isNewConsultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 relative border border-emerald-900/5 my-8">
            <button 
              onClick={() => setIsNewConsultOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Log Consultation Visit</h2>
            <form onSubmit={handleConsultSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Consultation Date</label>
                  <input
                    type="date" required
                    value={newConsultData.consultation_date}
                    onChange={(e) => setNewConsultData({ ...newConsultData, consultation_date: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={newConsultData.follow_up_date}
                    onChange={(e) => setNewConsultData({ ...newConsultData, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Primary Concerns *</label>
                <textarea
                  required rows="2"
                  value={newConsultData.concerns}
                  onChange={(e) => setNewConsultData({ ...newConsultData, concerns: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  placeholder="Sluggish digestion, morning lethargy, skin rashes..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Dosha Assessment & Intake Notes *</label>
                <textarea
                  required rows="2"
                  value={newConsultData.assessment}
                  onChange={(e) => setNewConsultData({ ...newConsultData, assessment: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  placeholder="Aggravated Kapha blocking Agni..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Clinical Recommendations *</label>
                <textarea
                  required rows="3"
                  value={newConsultData.recommendations}
                  onChange={(e) => setNewConsultData({ ...newConsultData, recommendations: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  placeholder="CCF tea twice daily, avoid raw foods, ginger kitchari mono-diet..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Follow-up Notes</label>
                <textarea
                  rows="2"
                  value={newConsultData.notes}
                  onChange={(e) => setNewConsultData({ ...newConsultData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  placeholder="Patient reports high compliance..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Publish Visit Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Progress Modal */}
      {isNewProgressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsNewProgressOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Log Progress Metrics</h2>
            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Record Date</label>
                  <input
                    type="date" required
                    value={newProgressData.record_date}
                    onChange={(e) => setNewProgressData({ ...newProgressData, record_date: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Weight (kg) *</label>
                  <input
                    type="number" step="0.1" required
                    value={newProgressData.weight}
                    onChange={(e) => setNewProgressData({ ...newProgressData, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                    placeholder="75.4"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Water Intake (L)</label>
                  <input
                    type="number" step="0.1"
                    value={newProgressData.water_intake}
                    onChange={(e) => setNewProgressData({ ...newProgressData, water_intake: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Adherence Rating</label>
                  <select
                    value={newProgressData.adherence}
                    onChange={(e) => setNewProgressData({ ...newProgressData, adherence: e.target.value })}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  >
                    <option value="High">High (80-100%)</option>
                    <option value="Medium">Medium (50-80%)</option>
                    <option value="Low">Low (0-50%)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Exercise Description</label>
                <input
                  type="text"
                  value={newProgressData.exercise}
                  onChange={(e) => setNewProgressData({ ...newProgressData, exercise: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  placeholder="30 min evening walk, gentle yoga..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Progress Notes</label>
                <textarea
                  rows="2"
                  value={newProgressData.notes}
                  onChange={(e) => setNewProgressData({ ...newProgressData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                  placeholder="Digestion seems stronger, morning heavy feel has reduced..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDetails;
