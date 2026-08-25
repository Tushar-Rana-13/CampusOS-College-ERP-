import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileCheck,
  LifeBuoy,
  LogOut,
  Bell,
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

// client/src/components/layout/Layout.jsx - Updated getNavLinks function
const getNavLinks = () => {
  const role = user?.role;
  const baseLinks = [
    {
      name: 'Dashboard',
      to: `/${role}/dashboard`,
      icon: LayoutDashboard,
    },
  ];

  if (role === 'student') {
    return [
      ...baseLinks,
      { name: 'My Courses', to: '/courses', icon: BookOpen },
      { name: 'Course Catalog', to: '/courses/catalog', icon: BookOpen },
      { name: 'Helpdesk', to: '/student/helpdesk', icon: LifeBuoy },
    ];
  }

  if (role === 'faculty') {
    return [
      ...baseLinks,
      { name: 'Managed Courses', to: '/courses', icon: BookOpen },
      { name: 'Helpdesk', to: '/faculty/helpdesk', icon: LifeBuoy },
    ];
  }

  if (role === 'admin') {
    return [
      ...baseLinks,
      { name: 'Course Directory', to: '/courses', icon: BookOpen },
      { name: 'System Helpdesk', to: '/admin/helpdesk', icon: LifeBuoy },
    ];
  }

  return baseLinks;
};

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* 📱 Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-sky-400" />
          <span className="font-bold text-lg text-white tracking-tight">CampusOS</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 🖥️ Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-800 border-r border-slate-700/60 flex-shrink-0 flex flex-col justify-between`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="hidden md:flex items-center space-x-3 p-6 border-b border-slate-700/60">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">CampusOS</h1>
              <p className="text-xs text-slate-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition duration-150 ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-700/60 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700/40">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 📄 Main Content Viewport */}
      <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8">
        <Outlet />
      </main>

    </div>
  );
}