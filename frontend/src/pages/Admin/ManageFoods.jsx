import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Database, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const CATEGORIES = [
  'Grains', 'Fruits', 'Vegetables', 'Pulses', 'Nuts', 'Seeds', 
  'Dairy', 'Spices', 'Herbs', 'Oils', 'Beverages', 'Prepared Foods'
];

const DOSHAS = ['Vata', 'Pitta', 'Kapha', 'Tridoshic'];

const ManageFoods = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dosha, setDosha] = useState('');

  // Modal forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const initialFormState = {
    name: '',
    category: 'Grains',
    serving_size: '100g',
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    vitamin_a: 0,
    vitamin_c: 0,
    vitamin_d: 0,
    vitamin_b12: 0,
    rasa: '',
    guna: '',
    virya: '',
    vipaka: '',
    dosha_effect: '',
    benefits: '',
    cautions: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (dosha) params.dosha = dosha;
      
      const res = await api.get('/foods', { params });
      if (res.data.success) {
        setFoods(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch food items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const delayDebounceFn = setTimeout(() => {
      fetchFoods();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, category, dosha]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.serving_size) {
      return setError('Name, category, and serving size are required fields.');
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.post('/foods', formData);
      if (res.data.success) {
        setSuccess('Food item added successfully.');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        fetchFoods();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create food item.');
    }
  };

  const handleEditClick = (food) => {
    setSelectedFood(food);
    setFormData({
      name: food.name,
      category: food.category,
      serving_size: food.serving_size,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbohydrates: food.carbohydrates || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      calcium: food.calcium || 0,
      iron: food.iron || 0,
      potassium: food.potassium || 0,
      vitamin_a: food.vitamin_a || 0,
      vitamin_c: food.vitamin_c || 0,
      vitamin_d: food.vitamin_d || 0,
      vitamin_b12: food.vitamin_b12 || 0,
      rasa: food.rasa || '',
      guna: food.guna || '',
      virya: food.virya || '',
      vipaka: food.vipaka || '',
      dosha_effect: food.dosha_effect || '',
      benefits: food.benefits || '',
      cautions: food.cautions || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/foods/${selectedFood.id}`, formData);
      if (res.data.success) {
        setSuccess('Food item updated successfully.');
        setIsEditModalOpen(false);
        setFormData(initialFormState);
        fetchFoods();
      }
    } catch (err) {
      setError('Failed to update food item.');
    }
  };

  const handleDeleteClick = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food item? It might be referenced in saved diets.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/foods/${foodId}`);
      if (res.data.success) {
        setSuccess('Food item deleted from database.');
        fetchFoods();
      }
    } catch (err) {
      setError('Failed to delete food item. Note: it might be in active dietitian plans.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Food Database & Properties</h1>
          <p className="text-sm text-emerald-800/70">Manage ingredients, macro/micronutrients, and Ayurvedic attributes</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>Add Food Item</span>
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

      {/* Search and Filters Block */}
      <div className="bg-white border border-emerald-900/5 rounded-2xl p-4 shadow-premium flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-emerald-900/30" />
          <input
            type="text"
            placeholder="Search food by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-emerald-50/10 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-emerald-50/10 border border-emerald-900/10 rounded-xl text-sm text-emerald-950 focus:ring-2 w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={dosha}
            onChange={(e) => setDosha(e.target.value)}
            className="px-3 py-2 bg-emerald-50/10 border border-emerald-900/10 rounded-xl text-sm text-emerald-950 focus:ring-2 w-full sm:w-auto"
          >
            <option value="">All Doshas</option>
            {DOSHAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : foods.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Database className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No food matches found</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Try expanding your search query or removing filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-emerald-900/5 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-900/5 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Food Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Serving</th>
                  <th className="px-6 py-4">Calories</th>
                  <th className="px-6 py-4">Carbs/Prot/Fat</th>
                  <th className="px-6 py-4">Ayurvedic Properties</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/5 text-sm text-emerald-950">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-emerald-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold">
                      <div>
                        <p>{food.name}</p>
                        <p className="text-[10px] font-bold text-emerald-700/70 tracking-wide uppercase mt-0.5">{food.dosha_effect || 'Tridoshic'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-emerald-900/70">{food.category}</td>
                    <td className="px-6 py-4 text-emerald-900/70">{food.serving_size}</td>
                    <td className="px-6 py-4 font-bold">{Math.round(food.calories)} kcal</td>
                    <td className="px-6 py-4 text-xs font-medium text-emerald-900/80">
                      C: {food.carbohydrates}g | P: {food.protein}g | F: {food.fat}g
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {food.rasa && (
                        <div className="space-y-0.5 text-emerald-900/60">
                          <p><strong className="text-emerald-950">Rasa:</strong> {food.rasa}</p>
                          <p><strong className="text-emerald-950">Virya:</strong> {food.virya} | <strong className="text-emerald-950">Vipaka:</strong> {food.vipaka}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(food)}
                        className="inline-flex p-2 rounded-lg text-emerald-800 hover:bg-emerald-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(food.id)}
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

      {/* Form Modal (Handles Add and Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative border border-emerald-900/5 my-8">
            <button 
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">
              {isEditModalOpen ? 'Modify Food Database Record' : 'Add New Food Database Record'}
            </h2>
            
            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              
              {/* Section 1: Basic Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">1. Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Food Name *</label>
                    <input
                      type="text" required name="name"
                      value={formData.name} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Cardamom"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Category *</label>
                    <select
                      name="category" value={formData.category} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Serving Size *</label>
                    <input
                      type="text" required name="serving_size"
                      value={formData.serving_size} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. 100g or 1 cup"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Macro & Micronutrients */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">2. Nutritional Profile (per serving)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Calories (kcal)</label>
                    <input
                      type="number" step="0.1" name="calories" value={formData.calories} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Protein (g)</label>
                    <input
                      type="number" step="0.1" name="protein" value={formData.protein} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Carbohydrates (g)</label>
                    <input
                      type="number" step="0.1" name="carbohydrates" value={formData.carbohydrates} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Fat (g)</label>
                    <input
                      type="number" step="0.1" name="fat" value={formData.fat} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Fiber (g)</label>
                    <input
                      type="number" step="0.1" name="fiber" value={formData.fiber} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Sugar (g)</label>
                    <input
                      type="number" step="0.1" name="sugar" value={formData.sugar} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Sodium (mg)</label>
                    <input
                      type="number" step="0.1" name="sodium" value={formData.sodium} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Calcium (mg)</label>
                    <input
                      type="number" step="0.1" name="calcium" value={formData.calcium} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Iron (mg)</label>
                    <input
                      type="number" step="0.1" name="iron" value={formData.iron} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-950 mb-1">Potassium (mg)</label>
                    <input
                      type="number" step="0.1" name="potassium" value={formData.potassium} onChange={handleInputChange}
                      className="w-full px-3 py-1.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Ayurvedic properties */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">3. Ayurvedic Properties</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Rasa (Taste)</label>
                    <input
                      type="text" name="rasa" value={formData.rasa} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Pungent, Sweet"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Guna (Quality)</label>
                    <input
                      type="text" name="guna" value={formData.guna} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Dry, Light"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Virya (Energy)</label>
                    <input
                      type="text" name="virya" value={formData.virya} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Heating or Cooling"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Vipaka (Post-Digestive)</label>
                    <input
                      type="text" name="vipaka" value={formData.vipaka} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Pungent, Sweet"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Dosha Balancing Effects</label>
                    <input
                      type="text" name="dosha_effect" value={formData.dosha_effect} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. V- K- P+ (in excess) or Tridoshic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Ayurvedic Benefits</label>
                    <textarea
                      name="benefits" value={formData.benefits} onChange={handleInputChange} rows="2"
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Kindles digestive Agni, flushes water retention..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Ayurvedic Cautions</label>
                    <textarea
                      name="cautions" value={formData.cautions} onChange={handleInputChange} rows="2"
                      className="w-full px-3 py-2 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                      placeholder="e.g. Avoid in case of hyperacidity or high inflammation..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                {isEditModalOpen ? 'Save Food Item Changes' : 'Publish Food Item'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageFoods;
