import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  X,
  AlertCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'patient'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch user directory.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/users/${selectedUser.id}`, editUserData);
      if (res.data.success) {
        setSuccess('User profile updated successfully.');
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setError('Failed to update user details.');
    }
  };

  const handleDeleteClick = async (user) => {
    if (user.role === 'admin') {
      return alert('Admin accounts cannot be deleted from the dashboard.');
    }
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action will permanently remove all linked records (clinical profile, progress charts, appointments, consultations).`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/admin/users/${user.id}`);
      if (res.data.success) {
        setSuccess('User account deleted.');
        fetchUsers();
      }
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">System Users Directory</h1>
          <p className="text-sm text-emerald-800/70">Audit and update role authorizations for all portal accounts</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-emerald-900/30" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
          />
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
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Directory list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-12 text-center shadow-premium">
          <Users className="h-12 w-12 text-emerald-900/20 mx-auto mb-3" />
          <h3 className="text-emerald-950 font-semibold">No users found</h3>
          <p className="text-sm text-emerald-800/50 mt-1">Try refining your search keyword.</p>
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
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/5 text-sm text-emerald-950">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-emerald-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-emerald-900/70">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : ''}
                        ${user.role === 'dietitian' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${user.role === 'patient' ? 'bg-sky-100 text-sky-700' : ''}
                      `}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-900/50">
                      {new Date(user.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="inline-flex p-2 rounded-lg text-emerald-800 hover:bg-emerald-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="inline-flex p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative border border-emerald-900/5">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-900/50 hover:text-emerald-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-emerald-950 mb-4">Edit User Account</h2>
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
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">System Role</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  disabled={selectedUser?.role === 'admin'}
                  className="w-full px-3 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm focus:ring-2"
                >
                  <option value="admin">Admin</option>
                  <option value="dietitian">Dietitian</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md transition-colors"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;
