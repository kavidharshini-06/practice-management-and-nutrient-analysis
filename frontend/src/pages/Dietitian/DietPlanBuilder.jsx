import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Save, 
  Heart, 
  ArrowLeft,
  Info,
  SlidersHorizontal,
  Flame,
  Dumbbell,
  Wheat,
  Activity,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const MEAL_TYPES = ['Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime'];
const MACRO_COLORS = ['#3b82f6', '#10b981', '#f59e0b']; // Carbs, Protein, Fat

const DietPlanBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Diet plan states
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [healthGoal, setHealthGoal] = useState('');
  const [notes, setNotes] = useState('');

  // Daily Meal configuration
  // Array of meals: { date, type, notes, items: [ { food_id, quantity, name, calories, protein, carbohydrates, fat, fiber } ] }
  const [meals, setMeals] = useState([]);
  
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading & logs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patRes, foodsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/foods')
        ]);
        
        setPatients(patRes.data.data);
        setFoods(foodsRes.data.data);

        // Check if pre-selected patient passed via router state
        if (location.state?.patient) {
          const prePat = location.state.patient;
          setSelectedPatientId(prePat.id);
          setSelectedPatient(prePat);
          setHealthGoal(prePat.health_goal || '');
        }
      } catch (err) {
        setError('Failed to fetch patients or ingredients.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location]);

  // Sync patient info
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === parseInt(selectedPatientId));
      setSelectedPatient(p || null);
    } else {
      setSelectedPatient(null);
    }
  }, [selectedPatientId, patients]);

  // Helper to scale food nutrients based on grams entered
  const scaleNutrient = (val, servingSize, qty) => {
    if (!val) return 0;
    const num = parseFloat(servingSize.replace(/[^0-9.]/g, '')) || 100;
    return parseFloat(((parseFloat(val) * parseFloat(qty)) / num).toFixed(2));
  };

  const handleAddMeal = (type) => {
    // Check if meal of this type already exists for activeDate
    const exists = meals.some(m => m.date === activeDate && m.type === type);
    if (exists) return alert(`A ${type} meal has already been added for ${activeDate}.`);

    setMeals([...meals, {
      date: activeDate,
      type: type,
      notes: '',
      items: []
    }]);
  };

  const handleAddFoodToMeal = (mealIdx, foodId) => {
    if (!foodId) return;
    const food = foods.find(f => f.id === parseInt(foodId));
    if (!food) return;

    const updatedMeals = [...meals];
    const itemExists = updatedMeals[mealIdx].items.some(i => i.food_id === food.id);
    if (itemExists) return alert('Ingredient already in this meal list.');

    // Add with default 100g quantity
    const defaultQty = 100;
    updatedMeals[mealIdx].items.push({
      food_id: food.id,
      name: food.name,
      serving_size: food.serving_size,
      quantity: defaultQty,
      calories: scaleNutrient(food.calories, food.serving_size, defaultQty),
      protein: scaleNutrient(food.protein, food.serving_size, defaultQty),
      carbohydrates: scaleNutrient(food.carbohydrates, food.serving_size, defaultQty),
      fat: scaleNutrient(food.fat, food.serving_size, defaultQty),
      fiber: scaleNutrient(food.fiber, food.serving_size, defaultQty)
    });

    setMeals(updatedMeals);
  };

  const handleUpdateItemQty = (mealIdx, itemIdx, qty) => {
    const updatedMeals = [...meals];
    const item = updatedMeals[mealIdx].items[itemIdx];
    const food = foods.find(f => f.id === item.food_id);
    if (!food) return;

    const numQty = parseFloat(qty) || 0;
    item.quantity = numQty;
    item.calories = scaleNutrient(food.calories, food.serving_size, numQty);
    item.protein = scaleNutrient(food.protein, food.serving_size, numQty);
    item.carbohydrates = scaleNutrient(food.carbohydrates, food.serving_size, numQty);
    item.fat = scaleNutrient(food.fat, food.serving_size, numQty);
    item.fiber = scaleNutrient(food.fiber, food.serving_size, numQty);

    setMeals(updatedMeals);
  };

  const handleRemoveItem = (mealIdx, itemIdx) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIdx].items.splice(itemIdx, 1);
    setMeals(updatedMeals);
  };

  const handleUpdateMealNotes = (mealIdx, text) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIdx].notes = text;
    setMeals(updatedMeals);
  };

  const handleRemoveMeal = (mealIdx) => {
    const updatedMeals = [...meals];
    updatedMeals.splice(mealIdx, 1);
    setMeals(updatedMeals);
  };

  // Aggregation logic for activeDate
  const getActiveDayTotals = () => {
    let cal = 0, prot = 0, carb = 0, fat = 0, fib = 0;
    meals.filter(m => m.date === activeDate).forEach(m => {
      m.items.forEach(i => {
        cal += i.calories;
        prot += i.protein;
        carb += i.carbohydrates;
        fat += i.fat;
        fib += i.fiber;
      });
    });
    return {
      calories: Math.round(cal),
      protein: parseFloat(prot.toFixed(1)),
      carbohydrates: parseFloat(carb.toFixed(1)),
      fat: parseFloat(fat.toFixed(1)),
      fiber: parseFloat(fib.toFixed(1))
    };
  };

  const totals = getActiveDayTotals();

  // Pie chart macro distribution: Carb (4 kcal/g), Prot (4 kcal/g), Fat (9 kcal/g)
  const chartData = [
    { name: 'Carbs', value: totals.carbohydrates * 4 },
    { name: 'Protein', value: totals.protein * 4 },
    { name: 'Fat', value: totals.fat * 9 }
  ].filter(d => d.value > 0);

  const handleSavePlan = async () => {
    if (!selectedPatientId) return alert('Please select a patient.');
    if (meals.length === 0) return alert('Please add at least one meal to save the diet plan.');

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const payload = {
        patient_id: parseInt(selectedPatientId),
        start_date: startDate,
        end_date: endDate,
        health_goal: healthGoal,
        notes: notes,
        meals: meals.map(m => ({
          date: m.date,
          type: m.type,
          notes: m.notes,
          items: m.items.map(i => ({
            food_id: i.food_id,
            quantity: i.quantity
          }))
        }))
      };

      const res = await api.post('/diet-plans', payload);
      if (res.data.success) {
        setSuccess('Diet plan successfully generated and saved.');
        setTimeout(() => {
          navigate(`/dietitian/patients/${selectedPatientId}`);
        }, 1500);
      }
    } catch (err) {
      setError('Failed to save diet plan.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  // Active meals filtered for display
  const activeMeals = meals.filter(m => m.date === activeDate);

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Diet Plan Builder</h1>
          <p className="text-sm text-emerald-800/70">Aggregate macronutrients and target specific Ayurvedic body profiles</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-sm font-medium">
          <Heart className="h-5 w-5 animate-pulse text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Builder parameters grid */}
      <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">Select Patient *</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            disabled={!!location.state?.patient}
            className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
          >
            <option value="">Choose Patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} (PAT-0{p.id})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">End Date *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">Health Goal</label>
          <input
            type="text"
            value={healthGoal}
            onChange={(e) => setHealthGoal(e.target.value)}
            className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
            placeholder="e.g. Lose 5kg and stoke Agni"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-emerald-950 mb-1">Dietitian Notes / Instructions</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
            placeholder="e.g. Sip warm water between meals. Drink Takra at lunch."
          />
        </div>
      </div>

      {/* Main Builder layout columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Planner Workspace */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Day Scheduler Navigation */}
          <div className="bg-white border border-emerald-900/5 rounded-2xl p-4 shadow-premium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-950">Active Planner Date:</span>
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="px-3 py-1 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm font-bold text-emerald-800"
              />
            </div>
            
            {/* Quick Add Meal type dropdown */}
            <div className="flex items-center gap-2">
              <select
                id="quick-meal-add"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMeal(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1 bg-emerald-800 text-white font-semibold text-xs rounded-xl focus:outline-none"
              >
                <option value="" disabled>+ Add Meal Period...</option>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Meals list */}
          {activeMeals.length === 0 ? (
            <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
              <Info className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
              <h3 className="text-emerald-950 font-semibold">No meals scheduled for this date</h3>
              <p className="text-sm text-emerald-800/50 mt-1">Select a meal period from the "+ Add Meal Period" dropdown to build the diet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal, mIdx) => {
                // Filter only meals of active date
                if (meal.date !== activeDate) return null;
                return (
                  <div key={mIdx} className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium space-y-4 relative">
                    <button 
                      onClick={() => handleRemoveMeal(mIdx)}
                      className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <h3 className="font-bold text-emerald-950">{meal.type}</h3>

                    {/* Meal items */}
                    {meal.items.length === 0 ? (
                      <p className="text-xs text-emerald-900/40 italic">No food items added. Pick an ingredient below.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {meal.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/20 border border-emerald-900/5 rounded-xl text-xs">
                            <div className="flex-1 min-w-[120px]">
                              <p className="font-semibold text-emerald-950">{item.name}</p>
                              <p className="text-[10px] text-emerald-900/50 mt-0.5">Serving: {item.serving_size}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-semibold text-emerald-900/40">Grams:</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(mIdx, iIdx, e.target.value)}
                                className="w-16 px-2 py-1 bg-white border border-emerald-900/10 rounded-lg text-center"
                              />
                            </div>

                            <div className="text-right min-w-[100px] text-[10px] font-medium text-emerald-900/70">
                              <p className="font-bold text-emerald-950 text-xs">{Math.round(item.calories)} kcal</p>
                              <p className="mt-0.5">C:{item.carbohydrates}g • P:{item.protein}g • F:{item.fat}g</p>
                            </div>

                            <button 
                              onClick={() => handleRemoveItem(mIdx, iIdx)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add food dropdown */}
                    <div className="flex gap-2 items-center">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          handleAddFoodToMeal(mIdx, e.target.value);
                          e.target.value = '';
                        }}
                        className="px-3 py-1.5 bg-emerald-50/30 border border-emerald-900/10 rounded-xl text-xs text-emerald-950 focus:ring-2"
                      >
                        <option value="">+ Add Ingredient...</option>
                        {foods.map(f => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Add preparation advice (e.g. Steam Asparagus with cumin)"
                        value={meal.notes}
                        onChange={(e) => handleUpdateMealNotes(mIdx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-emerald-50/10 border border-emerald-900/10 rounded-xl text-xs focus:ring-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleSavePlan}
            disabled={meals.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white font-semibold py-3.5 rounded-2xl shadow-premium shadow-emerald-800/10 transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>Generate & Save Complete Diet Plan</span>
          </button>
        </div>

        {/* Live Nutrient Summary Sidebar */}
        <div className="space-y-6">
          
          {/* Aggregated macro breakdown */}
          <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50 border-b border-emerald-100 pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>Daily Nutrient Calculations ({activeDate})</span>
            </h3>

            {/* Calories count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-50" />
                <div>
                  <p className="text-xs text-emerald-900/40 font-semibold leading-none">Total Calories</p>
                  <p className="text-2xl font-bold mt-1">{totals.calories} <span className="text-xs font-normal text-emerald-900/50">kcal</span></p>
                </div>
              </div>
              
              {/* Macro Pie Chart */}
              {chartData.length > 0 && (
                <div className="w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={15}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Macros progress list */}
            <div className="space-y-3.5 text-xs text-emerald-950">
              
              {/* Carbs */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="flex items-center gap-1"><Wheat className="h-3.5 w-3.5 text-blue-500" /> Carbs</span>
                  <span>{totals.carbohydrates} g</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (totals.carbohydrates / 250) * 100)}%` }}></div>
                </div>
              </div>

              {/* Protein */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5 text-emerald-600" /> Protein</span>
                  <span>{totals.protein} g</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${Math.min(100, (totals.protein / 70) * 100)}%` }}></div>
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" /> Fat</span>
                  <span>{totals.fat} g</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (totals.fat / 65) * 100)}%` }}></div>
                </div>
              </div>

              {/* Fiber */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="flex items-center gap-1">🌾 Dietary Fiber</span>
                  <span>{totals.fiber} g</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (totals.fiber / 30) * 100)}%` }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Patient Prakriti Advisory panel */}
          {selectedPatient && (
            <div className="bg-white border border-emerald-900/5 rounded-2xl p-5 shadow-premium space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 border-b border-emerald-100 pb-2">
                Ayurvedic Profile: {selectedPatient.prakriti || 'Vata'}
              </h3>
              
              <div className="text-xs text-emerald-900/80 space-y-2 leading-relaxed">
                <div>
                  <strong className="text-emerald-950 block">Rasa Preference (Tastes):</strong>
                  <p>{selectedPatient.rasa_preference || 'Sweet, Sour, Salty (Vata pacifying)'}</p>
                </div>
                <div>
                  <strong className="text-emerald-950 block">Advisory Guidance:</strong>
                  <p className="italic">
                    {selectedPatient.prakriti?.includes('Vata') && 'Vata needs warm, heavy, oily foods. Limit raw foods and dry grains.'}
                    {selectedPatient.prakriti?.includes('Pitta') && 'Pitta needs cooling, sweet, and bitter foods. Avoid spicy/sour ingredients.'}
                    {selectedPatient.prakriti?.includes('Kapha') && 'Kapha needs light, warm, dry, and pungent foods. Completely limit dairy/fats.'}
                    {!selectedPatient.prakriti && 'Fulfill general dietitian wellness guidelines.'}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-900/10 p-2.5 rounded-xl text-[10px] text-amber-800 leading-normal flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-700 flex-shrink-0" />
                  <span>
                    Recommendations should be presented as practitioner guidance and not as a replacement for medical diagnosis.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default DietPlanBuilder;
