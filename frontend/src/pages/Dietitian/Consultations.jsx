import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  ClipboardList, 
  Calendar, 
  User, 
  Clock, 
  BookOpen, 
  Info,
  AlertCircle
} from 'lucide-react';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consultations');
      if (res.data.success) {
        setConsultations(res.data.data);
      }
    } catch (err) {
      setError('Failed to retrieve consultation logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-950">Consultation History & Intake Logs</h1>
        <p className="text-sm text-emerald-800/70">Audit full patient clinical history, main concerns, and Ayurvedic advice</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {consultations.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <ClipboardList className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No consultations logged</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Visit a patient profile to log a consultation record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div key={c.id} className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium space-y-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-50 pb-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {c.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-emerald-950 text-sm">{c.patient_name}</h2>
                    <p className="text-[10px] text-emerald-900/50">Dietitian: {c.dietitian_name}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(c.consultation_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  </span>
                  {c.follow_up_date && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Follow-up: {c.follow_up_date}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/40 mb-1 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> Concerns
                  </h3>
                  <p className="text-emerald-950 font-medium leading-relaxed bg-slate-50/40 p-2.5 rounded-xl border border-slate-100">{c.concerns}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/40 mb-1 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> Ayurvedic Assessment
                  </h3>
                  <p className="text-emerald-950 font-medium leading-relaxed bg-slate-50/40 p-2.5 rounded-xl border border-slate-100">{c.assessment}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                    🌟 Recommendations
                  </h3>
                  <p className="text-emerald-800 font-bold leading-relaxed bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-900/5">{c.recommendations}</p>
                </div>
              </div>

              {/* Notes */}
              {c.notes && (
                <div className="text-xs text-emerald-900/60 bg-emerald-50/10 p-3 rounded-lg border border-emerald-900/5">
                  <strong className="text-emerald-950">Dietitian Notes:</strong> {c.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Consultations;
