import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileSearch,
  Users,
  Star,
  Calendar,
  BarChart2,
  FileText,
  ShieldCheck,
  Activity,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  LogOut,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, formatRole } from '../../utils/rbac';

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed, setIsCollapsed }) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Master navigation catalog with RBAC mapping
  const ALL_NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'rankings', label: 'Candidates', icon: Users },
    { id: 'screening', label: 'Screen Resumes', icon: FileSearch },
    { id: 'shortlist', label: 'Shortlist', icon: Star },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'history', label: 'Screening History', icon: History },
    { id: 'users', label: 'Users', icon: ShieldCheck },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Dynamically filter menu items strictly according to authenticated user role
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) =>
    hasPermission(user?.role, item.id)
  );

  return (
    <aside
      className={`bg-[#0A0E1A] dark:bg-[#080B14] text-slate-300 flex flex-col border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 select-none z-30 shrink-0 h-full ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800 bg-inherit">
        {!isCollapsed ? (
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            {/* Custom Brand Mark */}
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-indigo-500 transition-colors shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                HireNova
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Next-Gen Recruitment
              </span>
            </div>
          </div>
        ) : (
          <div
            className="w-full flex justify-center cursor-pointer"
            onClick={() => setCurrentTab('dashboard')}
            title="HireNova — Next-Gen Recruitment"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-md transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle rail"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dynamic Navigation Items */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => setCurrentTab(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-850 hover:translate-x-0.5'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>

              {/* Tooltip when collapsed */}
              {isCollapsed && hoveredItem === item.id && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap pointer-events-none animate-dropdown">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile & Session Actions */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1 bg-inherit">
        {/* Profile Card / Pill */}
        <div className="relative flex items-center justify-between">
          <button
            onClick={() => {
              if (isAuthenticated) {
                setCurrentTab('settings');
              } else {
                openAuthModal('login');
              }
            }}
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex-1 flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 min-w-0 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? (isAuthenticated ? user?.full_name : 'Sign in') : undefined}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'Profile'}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0">
                {isAuthenticated && user?.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : <User className="w-3.5 h-3.5" />}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col text-left leading-none min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {isAuthenticated ? (user?.full_name || 'Recruiter') : 'Sign In'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider truncate font-semibold">
                  {isAuthenticated ? formatRole(user?.role) : 'Guest'}
                </span>
              </div>
            )}
          </button>

          {isAuthenticated && !isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1 btn-interactive"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expand toggle when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex justify-center py-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
