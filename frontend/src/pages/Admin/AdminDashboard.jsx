import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp, 
  Database, 
  Activity, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#0284c7', '#d97706', '#16a34a', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setCharts(res.data.charts);
        }
      } catch (err) {
        setError('Failed to retrieve system statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: 'Active Dietitians', value: stats.totalDietitians, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Diet Plans', value: stats.activeDietPlans, icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Consultations Logged', value: stats.completedConsultations, icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Foods Database', value: stats.foodDatabaseCount, icon: Database, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-950">Admin Analytics Dashboard</h1>
        <p className="text-sm text-emerald-800/70">Overview of users, patient growth, and system metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-emerald-900/5 rounded-2xl p-4 shadow-premium flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900/50 leading-none">{card.label}</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Patient Growth Area Chart */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium">
          <h2 className="text-sm font-semibold text-emerald-950 mb-4">Patient Registrations</h2>
          <div className="h-80">
            {charts?.patientGrowth && charts.patientGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.patientGrowth}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-emerald-900/40 text-sm">No growth data logged yet.</div>
            )}
          </div>
        </div>

        {/* Appointments Timeline Bar Chart */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium">
          <h2 className="text-sm font-semibold text-emerald-950 mb-4">Appointment Load</h2>
          <div className="h-80">
            {charts?.appointmentTimeline && charts.appointmentTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.appointmentTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-emerald-900/40 text-sm">No appointments scheduled yet.</div>
            )}
          </div>
        </div>

        {/* Prakriti/Prakruthi Distribution Pie Chart */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium">
          <h2 className="text-sm font-semibold text-emerald-950 mb-4">Patient Prakriti (Body-Type) Distribution</h2>
          <div className="h-80 flex flex-col sm:flex-row items-center justify-center gap-4">
            {charts?.prakritiStats && charts.prakritiStats.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.prakritiStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.prakritiStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  {charts.prakritiStats.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-medium text-emerald-950">{entry.name}</span>
                      </div>
                      <span className="font-bold text-emerald-900/70">{entry.value} clients</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-emerald-900/40 text-sm">No body profile data registered yet.</div>
            )}
          </div>
        </div>

        {/* Appointment Status Pie Chart */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium">
          <h2 className="text-sm font-semibold text-emerald-950 mb-4">Appointment Status Breakup</h2>
          <div className="h-80 flex flex-col sm:flex-row items-center justify-center gap-4">
            {charts?.appointmentStatusStats && charts.appointmentStatusStats.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.appointmentStatusStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.appointmentStatusStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  {charts.appointmentStatusStats.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></span>
                        <span className="font-medium text-emerald-950">{entry.name}</span>
                      </div>
                      <span className="font-bold text-emerald-900/70">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-emerald-900/40 text-sm">No appointments scheduled.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
