import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  ArrowLeft, 
  Printer, 
  Clipboard, 
  Flame, 
  Activity, 
  Wheat, 
  Dumbbell, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

const DietPlanViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/diet-plans/${id}`);
        if (res.data.success) {
          setPlan(res.data.data);
        }
      } catch (err) {
        setError('Failed to fetch diet plan details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Diet plan details not found.'}</span>
        </div>
      </div>
    );
  }

  // Group meals by date
  const mealsByDate = {};
  plan.meals.forEach(m => {
    if (!mealsByDate[m.date]) {
      mealsByDate[m.date] = [];
    }
    mealsByDate[m.date].push(m);
  });

  // Calculate overall plan average daily nutrients
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0, totalFib = 0;
  let totalDays = Object.keys(mealsByDate).length || 1;

  plan.meals.forEach(m => {
    m.items.forEach(i => {
      totalCal += i.calories;
      totalProt += i.protein;
      totalCarb += i.carbohydrates;
      totalFat += i.fat;
      totalFib += i.fiber;
    });
  });

  const dailyAvg = {
    calories: Math.round(totalCal / totalDays),
    protein: parseFloat((totalProt / totalDays).toFixed(1)),
    carbohydrates: parseFloat((totalCarb / totalDays).toFixed(1)),
    fat: parseFloat((totalFat / totalDays).toFixed(1)),
    fiber: parseFloat((totalFib / totalDays).toFixed(1)),
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Action Header bar (Hidden in Print) */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4 no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100">
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <span className="text-sm font-semibold text-emerald-900/50">Diet Plan Report</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-850 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
        >
          <Printer className="h-4 w-4" />
          <span>Print PDF / Download PDF</span>
        </button>
      </div>

      {/* Main Clinical Report Document */}
      <div className="bg-white border border-emerald-950/10 rounded-2xl p-8 shadow-premium space-y-8 print-card">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-100 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950">Ayurvedic Diet & Meal Guideline</h1>
            <p className="text-xs text-emerald-900/50 mt-1">Authorized clinical wellness report • AyurDiet Practice Systems</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-900">{plan.dietitian_name || 'Dr. Aarav Sharma'}</p>
            <p className="text-xs text-emerald-900/50">Ayurvedic Dietitian Practitioner</p>
          </div>
        </div>

        {/* Patient Parameters Block */}
        <div className="bg-emerald-50/20 border border-emerald-900/5 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-emerald-900/40 font-bold uppercase tracking-wider">Patient Name</span>
            <p className="text-sm font-bold text-emerald-950 mt-0.5">{plan.patient_name}</p>
          </div>
          <div>
            <span className="text-emerald-900/40 font-bold uppercase tracking-wider">Ayurvedic Prakriti</span>
            <p className="text-sm font-bold text-emerald-800 mt-0.5">{plan.prakriti || 'Vata'}</p>
          </div>
          <div>
            <span className="text-emerald-900/40 font-bold uppercase tracking-wider">Date Schedule</span>
            <p className="text-sm font-semibold text-emerald-950 mt-0.5">{plan.start_date} to {plan.end_date}</p>
          </div>
          <div>
            <span className="text-emerald-900/40 font-bold uppercase tracking-wider">Primary Goal</span>
            <p className="text-sm font-semibold text-emerald-950 mt-0.5">{plan.health_goal || 'General Health Restoration'}</p>
          </div>
        </div>

        {/* Target Daily Nutrients Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-1">Daily Nutrient Target Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-emerald-950">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-semibold text-emerald-900/40 block">Calories</span>
              <p className="text-lg font-bold mt-1 text-slate-800">{dailyAvg.calories} kcal</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-[10px] font-semibold text-blue-900/40 block">Carbohydrates</span>
              <p className="text-lg font-bold mt-1 text-blue-800">{dailyAvg.carbohydrates} g</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-semibold text-emerald-900/40 block">Protein</span>
              <p className="text-lg font-bold mt-1 text-emerald-800">{dailyAvg.protein} g</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-[10px] font-semibold text-amber-900/40 block">Fat</span>
              <p className="text-lg font-bold mt-1 text-amber-800">{dailyAvg.fat} g</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <span className="text-[10px] font-semibold text-purple-900/40 block">Dietary Fiber</span>
              <p className="text-lg font-bold mt-1 text-purple-800">{dailyAvg.fiber} g</p>
            </div>
          </div>
        </div>

        {/* Daily Meal schedule details */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-1">Scheduled Meal Guidelines</h2>
          
          {Object.keys(mealsByDate).map(dateStr => (
            <div key={dateStr} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-850 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-900/5">
                <Calendar className="h-4 w-4" />
                <span>Date: {new Date(dateStr).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
              </div>
              
              <div className="space-y-3.5 pl-2">
                {mealsByDate[dateStr].map(meal => (
                  <div key={meal.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm border-b border-emerald-50 pb-3.5 last:border-b-0">
                    
                    {/* Meal Period */}
                    <div className="font-bold text-emerald-950 flex flex-col justify-center">
                      <p>{meal.type}</p>
                      {meal.notes && <p className="text-[10px] font-normal text-emerald-900/50 italic mt-0.5">Note: {meal.notes}</p>}
                    </div>

                    {/* Food Items */}
                    <div className="md:col-span-2 space-y-1">
                      {meal.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-emerald-950">
                          <span>{item.food_name}</span>
                          <span className="font-bold text-emerald-900/60">{item.quantity}g</span>
                        </div>
                      ))}
                    </div>

                    {/* Nutrients */}
                    <div className="text-right flex flex-col justify-center text-xs text-emerald-900/60">
                      <span className="font-bold text-emerald-950">{Math.round(meal.items.reduce((acc, i) => acc + i.calories, 0))} kcal</span>
                      <span className="text-[10px] mt-0.5">
                        C: {meal.items.reduce((acc, i) => acc + i.carbohydrates, 0).toFixed(1)}g | 
                        P: {meal.items.reduce((acc, i) => acc + i.protein, 0).toFixed(1)}g | 
                        F: {meal.items.reduce((acc, i) => acc + i.fat, 0).toFixed(1)}g
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ayurvedic Dietitian Notes */}
        {plan.notes && (
          <div className="space-y-3 page-break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-1">Dietitian Practitioner Notes</h2>
            <p className="text-sm text-emerald-950 leading-relaxed bg-emerald-50/20 border border-emerald-900/5 p-4 rounded-xl">
              {plan.notes}
            </p>
          </div>
        )}

        {/* Disclaimer Warning */}
        <div className="bg-amber-50 border border-amber-900/10 p-4 rounded-2xl text-[10px] text-amber-800 leading-relaxed flex gap-3 page-break-inside-avoid">
          <Info className="h-5 w-5 text-amber-700 flex-shrink-0" />
          <div>
            <strong className="text-amber-900 block font-semibold mb-0.5">Ayurvedic Nutritional Disclaimer:</strong>
            These dietary suggestions are intended as practitioner wellness guidance for maintaining energetic balance and supporting digestion (Agni). They are not designed or intended as a replacement for standard medical diagnosis, treatment, or clinical consultation. Please review these ingredients with your primary care provider if taking medications.
          </div>
        </div>

      </div>

    </div>
  );
};

export default DietPlanViewer;
