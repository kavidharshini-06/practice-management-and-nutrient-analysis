import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, 
  Search, 
  Plus, 
  ChevronRight, 
  User, 
  Mail, 
  Phone,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';

const PRAKRITIS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'];

const Patients = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const initialFormState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    height: 170,
    weight: 70,
    activity_level: 'Moderate',
    allergies: '',
    dietary_restrictions: '',
    health_goal: '',
    current_diet: '',
    lifestyle_info: '',
    prakriti: 'Vata',
    rasa_preference: '',
    lifestyle_notes: '',
    sleep_duration: 7.0,
    exercise_level: 'Moderate',
    stress_level: 'Medium',
    water_intake: 2.0
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      if (res.data.success) {
        setPatients(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch patient directories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // If navigated with state to open add modal immediately
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      return setError('Name and email are required fields.');
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.post('/patients', formData);
      if (res.data.success) {
        setSuccess('Patient created successfully with default credentials.');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        fetchPatients();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create patient record.');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.prakriti && p.prakriti.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Patient Directory</h1>
          <p className="text-sm text-emerald-800/70">Audit clinical records, Ayurvedic constitutions, and diagnostic progress</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>New Patient Registration</span>
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

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-emerald-900/30" />
        <input
          type="text"
          placeholder="Search by name, email, or Prakriti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Users className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No patients found</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Register a new patient or change search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((p) => (
            <div 
              key={p.id}
              onClick={() => navigate(`/dietitian/patients/${p.id}`)}
              className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover hover:border-emerald-950/10 -translate-y-0.5 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-emerald-950 truncate max-w-[150px]">{p.name}</h2>
                      <p className="text-xs text-emerald-900/50 truncate max-w-[150px]">{p.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${p.prakriti?.startsWith('Vata') ? 'bg-sky-50 text-sky-700' : ''}
                    ${p.prakriti?.startsWith('Pitta') ? 'bg-amber-50 text-amber-700' : ''}
                    ${p.prakriti?.startsWith('Kapha') ? 'bg-emerald-50 text-emerald-700' : ''}
                    ${!p.prakriti ? 'bg-emerald-50 text-emerald-700' : ''}
                  `}>
                    {p.prakriti || 'Vata'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 border-y border-emerald-50 py-3 text-center">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-900/40 uppercase">Height</p>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{p.height} cm</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-900/40 uppercase">Weight</p>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{p.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-900/40 uppercase">BMI</p>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{p.bmi || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mt-4 pt-2">
                <span>View Clinical Profile</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative border border-emerald-900/5 my-8">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Patient Profile Intake</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              
              {/* Section 1: User details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-850 mb-2 border-b border-emerald-100 pb-1">1. User Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Full Name *</label>
                    <input
                      type="text" required name="name"
                      value={formData.name} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="Aniket Das"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Email Address *</label>
                    <input
                      type="email" required name="email"
                      value={formData.email} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="aniket@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Access Password (Optional, defaults to 'password123')</label>
                    <input
                      type="password" name="password"
                      value={formData.password} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
                    <input
                      type="text" name="phone"
                      value={formData.phone} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="+91 99999 88888"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-850 mb-2 border-b border-emerald-100 pb-1">2. Basic Anthropometrics & Goals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Date of Birth</label>
                    <input
                      type="date" name="date_of_birth"
                      value={formData.date_of_birth} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Gender</label>
                    <select
                      name="gender" value={formData.gender} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Height (cm)</label>
                    <input
                      type="number" name="height"
                      value={formData.height} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Weight (kg)</label>
                    <input
                      type="number" step="0.1" name="weight"
                      value={formData.weight} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Allergies</label>
                    <input
                      type="text" name="allergies" value={formData.allergies} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Peanuts, Gluten"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Dietary Restrictions</label>
                    <input
                      type="text" name="dietary_restrictions" value={formData.dietary_restrictions} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Vegetarian, Lactose-intolerant"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Current Health Goals</label>
                    <textarea
                      name="health_goal" value={formData.health_goal} onChange={handleInputChange} rows="2"
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="Weight management, relieve lethargy, balance digestive fire..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Ayurvedic profile */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-850 mb-2 border-b border-emerald-100 pb-1">3. Ayurvedic Prakriti & Lifestyle Profile</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Prakriti (Body-Type)</label>
                    <select
                      name="prakriti" value={formData.prakriti} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    >
                      {PRAKRITIS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Sleep (Hrs/day)</label>
                    <input
                      type="number" step="0.5" name="sleep_duration" value={formData.sleep_duration} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Water Intake (L/day)</label>
                    <input
                      type="number" step="0.5" name="water_intake" value={formData.water_intake} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Stress Level</label>
                    <select
                      name="stress_level" value={formData.stress_level} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Taste Preferences (Rasa)</label>
                    <input
                      type="text" name="rasa_preference" value={formData.rasa_preference} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Sweet, Pungent, Bitter"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Lifestyle & Daily Routine Notes</label>
                    <textarea
                      name="lifestyle_notes" value={formData.lifestyle_notes} onChange={handleInputChange} rows="2"
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="Late sleeper, irregular eating timings..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Register Patient
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Patients;
