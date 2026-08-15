import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  FileText, 
  Calendar, 
  ArrowRight,
  Info,
  Clock,
  AlertCircle
} from 'lucide-react';

const MyDietPlan = () => {
  const navigate = useNavigate();
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDietPlans = async () => {
      try {
        setLoading(true);
        // GET /diet-plans returns plans filtered by patient user role inside controller
        const res = await api.get('/diet-plans');
        if (res.data.success) {
          setDietPlans(res.data.data);
        }
      } catch (err) {
        setError('Failed to fetch your diet plans.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDietPlans();
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
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const activePlan = dietPlans.find(p => p.status === 'Active');
  const pastPlans = dietPlans.filter(p => p.status !== 'Active');

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-950">My Diet Guides & Plans</h1>
        <p className="text-sm text-emerald-800/70">Access active and historical meal recommendations from your dietitian</p>
      </div>

      {/* Active Diet Plan */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50">Active Plan</h2>
        {activePlan ? (
          <div className="bg-white border border-emerald-900/10 rounded-2xl p-6 shadow-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800/60">
                <Clock className="h-4 w-4 text-emerald-700/55" />
                <span>Valid: {activePlan.start_date} to {activePlan.end_date}</span>
              </div>
              <h3 className="text-lg font-bold text-emerald-950">Goal: {activePlan.health_goal || 'General Health'}</h3>
              <p className="text-xs text-emerald-900/60 leading-relaxed max-w-xl">
                {activePlan.notes || 'Eat warm, light, cooked meals. Sip hot water with fennel.'}
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/patient/diet-plans/view/${activePlan.id}`)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1 whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              <span>Open Meal Guide</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="bg-white border border-emerald-900/5 rounded-2xl p-8 text-center shadow-premium">
            <Info className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
            <h3 className="text-emerald-950 font-semibold">No active plan assigned</h3>
            <p className="text-sm text-emerald-800/50 mt-1">Your dietitian will create and assign an Ayurvedic diet plan shortly.</p>
          </div>
        )}
      </div>

      {/* Historical Plans */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50">Historical Plans</h2>
        {pastPlans.length === 0 ? (
          <p className="text-xs text-emerald-900/40 italic">No past plans logged.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastPlans.map((plan) => (
              <div key={plan.id} className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-900/40 font-bold uppercase">{plan.start_date} to {plan.end_date}</span>
                  <h4 className="font-bold text-emerald-950 text-sm">Goal: {plan.health_goal || 'General Health'}</h4>
                  {plan.notes && <p className="text-xs text-emerald-900/60 line-clamp-2">{plan.notes}</p>}
                </div>
                
                <button
                  onClick={() => navigate(`/patient/diet-plans/view/${plan.id}`)}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 mt-4 border-t border-emerald-50 pt-3"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Open Report</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyDietPlan;
