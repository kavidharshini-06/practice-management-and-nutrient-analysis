import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  Lock,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const ManageDietitians = () => {
  const [dietitians, setDietitians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal forms state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [editUserData, setEditUserData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const fetchDietitians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dietitians');
      if (res.data.success) {
        setDietitians(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch dietitian directories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDietitians();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      return setError('Name, email, and password are required fields.');
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.post('/admin/dietitians', newUserData);
      if (res.data.success) {
        setSuccess('Dietitian registered successfully.');
        setIsAddModalOpen(false);
        setNewUserData({ name: '', email: '', password: '', phone: '' });
        fetchDietitians();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dietitian account.');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/users/${selectedUser.id}`, {
        name: editUserData.name,
        email: editUserData.email,
        phone: editUserData.phone,
        role: 'dietitian'
      });
      if (res.data.success) {
        setSuccess('Dietitian credentials updated.');
        setIsEditModalOpen(false);
        fetchDietitians();
      }
    } catch (err) {
      setError('Failed to update dietitian details.');
    }
  };

  const handleDeleteClick = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this dietitian account? All their patient assignments will be affected.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setSuccess('Dietitian account deleted successfully.');
        fetchDietitians();
      }
    } catch (err) {
      setError('Failed to delete dietitian.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Manage Dietitians</h1>
          <p className="text-sm text-emerald-800/70">Register and monitor professional practitioner credentials</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-800/10"
        >
          <Plus className="h-4 w-4" />
          <span>Add Dietitian</span>
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

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : dietitians.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Users className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No dietitians registered</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Register a dietitian above to start management.</p>
        </div>
      ) : (
        <div className="bg-white border border-emerald-900/5 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-900/5 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/5 text-sm text-emerald-950">
                {dietitians.map((dietitian) => (
                  <tr key={dietitian.id} className="hover:bg-emerald-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold">{dietitian.name}</td>
                    <td className="px-6 py-4">{dietitian.email}</td>
                    <td className="px-6 py-4 text-emerald-900/70">{dietitian.phone || '—'}</td>
                    <td className="px-6 py-4 text-emerald-900/50">
                      {new Date(dietitian.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(dietitian)}
                        className="inline-flex p-2 rounded-lg text-emerald-800 hover:bg-emerald-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(dietitian.id)}
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

      {/* Add Dietitian Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Register New Dietitian</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-850"
                    placeholder="Dr. Sanya Roy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-850"
                    placeholder="sanya@ayurdiet.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-850"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                  <input
                    type="text"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-850"
                    placeholder="+91 99999 88888"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Register Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dietitian Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Edit Dietitian Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                />
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

    </div>
  );
};

export default ManageDietitians;
