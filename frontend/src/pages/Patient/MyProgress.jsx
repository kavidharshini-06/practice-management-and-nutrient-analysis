import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  TrendingUp, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Droplet,
  Dumbbell
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

const MyProgress = () => {
  const [progressRecords, setProgressRecords] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
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

      const patRes = await api.get('/patients');
      const activePat = patRes.data.data[0];
      
      if (activePat) {
        setProfile(activePat);
        // Fetch progress records
        // GET /progress/:patientId will route inside backend controller
        const progRes = await api.get(`/progress/${activePat.id}`);
        setProgressRecords(progRes.data.data);
      }
    } catch (err) {
      setError('Failed to retrieve progress data.');
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
    if (!formData.weight || !formData.record_date) {
      return setError('Weight and date are required fields.');
    }

    try {
      setError('');
      setSuccess('');
      const payload = {
        ...formData,
        patient_id: profile.id
      };

      const res = await api.post('/progress', payload);
      if (res.data.success) {
        setSuccess('Progress entry logged successfully.');
        setIsAddModalOpen(false);
        setFormData({
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
      setError('Failed to save progress entry.');
    }
  };

  if (loading && progressRecords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">My Health Progress</h1>
          <p className="text-sm text-emerald-800/70">Monitor your weight metrics, hydration logs, and dietary adherence over time</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>Log Daily Stats</span>
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

      {progressRecords.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <TrendingUp className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No progress data logged yet</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Submit your first daily log above to render the timeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Recharts chart */}
          <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium xl:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-50 pb-2">Weight Timeline (kg)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressRecords}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="record_date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium max-h-[380px] overflow-y-auto space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-2">History logs</h3>
            {progressRecords.map((rec) => (
              <div key={rec.id} className="p-3 bg-emerald-50/20 border border-emerald-900/5 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-emerald-950">Weight: {rec.weight} kg</p>
                  <p className="text-[10px] text-emerald-900/40 mt-0.5">{rec.record_date}</p>
                  {rec.notes && <p className="text-[10px] text-emerald-900/60 mt-1 italic">"{rec.notes}"</p>}
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">BMI: {rec.bmi}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Log Stats Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Log Today's Stats</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Date *</label>
                  <input
                    type="date"
                    name="record_date"
                    required
                    value={formData.record_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Weight (kg) *</label>
                  <input
                    type="number" step="0.1"
                    name="weight"
                    required
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                    placeholder="e.g. 74.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Water Intake (L)</label>
                  <input
                    type="number" step="0.5"
                    name="water_intake"
                    value={formData.water_intake}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Diet Adherence</label>
                  <select
                    name="adherence"
                    value={formData.adherence}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  >
                    <option value="High">High (followed fully)</option>
                    <option value="Medium">Medium (some deviations)</option>
                    <option value="Low">Low (ignored guidelines)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Exercise Notes</label>
                <input
                  type="text"
                  name="exercise"
                  value={formData.exercise}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  placeholder="e.g. 30 min morning yoga, brisk walking"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">How do you feel? (General notes)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-xs focus:ring-2"
                  placeholder="Feeling energetic, bowel movement is regular, sleeping better..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Publish Daily Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyProgress;
