import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar, 
  Database, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Heart,
  Briefcase
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/dietitians', label: 'Dietitians', icon: Briefcase },
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/foods', label: 'Food Database', icon: Database },
          { to: '/admin/settings', label: 'Settings', icon: Settings },
        ];
      case 'dietitian':
        return [
          { to: '/dietitian', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dietitian/patients', label: 'Patients', icon: Users },
          { to: '/dietitian/foods', label: 'Food Database', icon: Database },
          { to: '/dietitian/appointments', label: 'Appointments', icon: Calendar },
          { to: '/dietitian/consultations', label: 'Consultations', icon: ClipboardList },
          { to: '/dietitian/settings', label: 'Settings', icon: Settings },
        ];
      case 'patient':
        return [
          { to: '/patient', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/patient/diet-plan', label: 'My Diet Plan', icon: ClipboardList },
          { to: '/patient/appointments', label: 'Appointments', icon: Calendar },
          { to: '/patient/progress', label: 'My Progress', icon: TrendingUp },
          { to: '/patient/settings', label: 'Profile Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-emerald-900/5 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-emerald-900/5 bg-emerald-50/30">
          <Heart className="h-6 w-6 text-emerald-700 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold text-emerald-900 tracking-tight leading-none">AyurDiet</h1>
            <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase">Wellness Portal</span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="p-4 mx-4 my-3 rounded-xl bg-emerald-50/20 border border-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-emerald-900 truncate">{user.name}</h2>
              <p className="text-[10px] text-emerald-600 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/10' 
                    : 'text-emerald-900/70 hover:bg-emerald-50/50 hover:text-emerald-900'}
                `}
                end
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-emerald-900/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
