import React from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-white/80 backdrop-blur-md border-b border-emerald-900/5 no-print">
      {/* Left side: Mobile menu toggle + Brand Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-900 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-900/10 px-3 py-1 rounded-full capitalize">
          {user?.role} Portal
        </span>
      </div>

      {/* Right side: Notifications and Profile Info */}
      <div className="flex items-center gap-4">
        {/* Mock Notification Bell */}
        <button className="p-2 rounded-lg text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-900 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white"></span>
        </button>

        {/* User Profile Summary */}
        <div className="flex items-center gap-3 pl-3 border-l border-emerald-900/5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-emerald-900 leading-none">{user?.name}</p>
            <p className="text-[10px] text-emerald-600 font-medium truncate mt-0.5">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-900/10 flex items-center justify-center text-emerald-800">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
