import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  
  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  // Password Form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name) {
      return setProfileError('Name cannot be empty.');
    }

    try {
      setProfileError('');
      setProfileSuccess('');
      setProfileLoading(true);

      // Call API to update user details
      const res = await api.put(`/admin/users/${user.id}`, {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: user.role
      });

      if (res.data.success) {
        setProfileSuccess('Profile settings updated successfully.');
        updateUserProfile({ name: profileData.name, phone: profileData.phone });
      }
    } catch (err) {
      setProfileError('Failed to update profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return setPasswordError('Please fill in all password fields.');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setPasswordError('Password must be at least 6 characters.');
    }

    try {
      setPasswordError('');
      setPasswordSuccess('');
      setPasswordLoading(true);

      // Call API to reset password using standard reset endpoint or custom
      const res = await api.post('/auth/reset-password', {
        email: user.email,
        newPassword
      });

      if (res.data.success) {
        setPasswordSuccess('Password changed successfully.');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError('Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-950 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-emerald-800" />
          <span>Portal Account Settings</span>
        </h1>
        <p className="text-sm text-emerald-800/70">Modify your login credentials and personal contact card details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium space-y-4">
          <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2 border-b border-emerald-50 pb-2">
            <User className="h-4 w-4 text-emerald-800" />
            <span>Profile Information</span>
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">Full Name</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-emerald-900/30" />
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-emerald-900/30" />
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                  placeholder="+91 99999 88888"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl p-6 shadow-premium space-y-4">
          <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2 border-b border-emerald-50 pb-2">
            <Lock className="h-4 w-4 text-emerald-800" />
            <span>Change Password</span>
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Settings;
