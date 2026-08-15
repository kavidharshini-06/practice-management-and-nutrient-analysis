import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, 
  Calendar, 
  Activity, 
  Clipboard, 
  Plus, 
  ClipboardCopy, 
  Database, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const DietitianDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activePlans: 0,
    pendingConsultations: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dietitian-specific data
        const apptsRes = await api.get('/appointments');
        const patientsRes = await api.get('/patients');
        const plansRes = await api.get('/diet-plans');

        const activePlans = plansRes.data.data.filter(p => p.status === 'Active').length;
        
        // Find appointments for today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = apptsRes.data.data.filter(a => {
          const apptDate = a.appointment_date || a.APPOINTMENT_DATE;
          return apptDate === todayStr;
        });

        // Simulating stats
        setStats({
          totalPatients: patientsRes.data.data.length,
          todayAppointments: todayAppts.length,
          activePlans: activePlans,
          pendingConsultations: apptsRes.data.data.filter(a => a.status === 'Confirmed' || a.status === 'Scheduled').length
        });

        setAppointments(apptsRes.data.data.slice(0, 5));
        setPatients(patientsRes.data.data.slice(0, 5));
      } catch (err) {
        setError('Failed to fetch clinical dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'My Patients', value: stats.totalPatients, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Diet Plans', value: stats.activePlans, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Follow-ups Required', value: stats.pendingConsultations, icon: Clipboard, color: 'text-purple-600 bg-purple-50' }
  ];

  const quickActions = [
    { label: 'Add Patient', action: () => navigate('/dietitian/patients', { state: { openAddModal: true } }), icon: Plus, color: 'bg-emerald-850 hover:bg-emerald-800 text-white' },
    { label: 'Create Diet Plan', action: () => navigate('/dietitian/patients'), icon: ClipboardCopy, color: 'bg-white border border-emerald-900/10 text-emerald-950 hover:bg-emerald-50/50' },
    { label: 'Schedule Visit', action: () => navigate('/dietitian/appointments'), icon: Calendar, color: 'bg-white border border-emerald-900/10 text-emerald-950 hover:bg-emerald-50/50' },
    { label: 'Add Ayurvedic Food', action: () => navigate('/dietitian/foods'), icon: Database, color: 'bg-white border border-emerald-900/10 text-emerald-950 hover:bg-emerald-50/50' },
    { label: 'Record Consultation', action: () => navigate('/dietitian/consultations'), icon: Clipboard, color: 'bg-white border border-emerald-900/10 text-emerald-950 hover:bg-emerald-50/50' }
  ];

  return (
    <div className="p-6 space-y-6">
      
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-950">Dietitian Dashboard</h1>
        <p className="text-sm text-emerald-800/70">Manage client prakriti assessments, schedule consultations, and write meal guides.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900/50 leading-none">{c.label}</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1.5">{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Row */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.action}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-premium hover:shadow-premium-hover ${action.color}`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Appointments */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium lg:col-span-2">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
            <h2 className="font-bold text-emerald-950">Upcoming Appointments</h2>
            <button 
              onClick={() => navigate('/dietitian/appointments')} 
              className="text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="py-8 text-center text-emerald-900/40 text-sm">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3.5 bg-emerald-50/20 border border-emerald-900/5 rounded-xl">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">{appt.patient_name}</h3>
                    <p className="text-xs text-emerald-900/60 mt-0.5">{appt.appointment_type} • {appt.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-800">{appt.appointment_time}</p>
                    <p className="text-[10px] text-emerald-900/50 mt-0.5">{appt.appointment_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
            <h2 className="font-bold text-emerald-950">Recent Patients</h2>
            <button 
              onClick={() => navigate('/dietitian/patients')} 
              className="text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:underline"
            >
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {patients.length === 0 ? (
            <div className="py-8 text-center text-emerald-900/40 text-sm">
              No patients registered.
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((pat) => (
                <div 
                  key={pat.id} 
                  onClick={() => navigate(`/dietitian/patients/${pat.id}`)}
                  className="flex items-center gap-3 p-2 hover:bg-emerald-50/30 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                    {pat.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-emerald-950 truncate">{pat.name}</h3>
                    <p className="text-xs text-emerald-600 font-medium">{pat.prakriti || 'Vata-Pitta'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DietitianDashboard;
