import React, { useState } from 'react';
import {
  Menu,
  Plus,
  LogIn,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ currentTab, setCurrentTab, toggleMobileSidebar }) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return user?.role?.toLowerCase() === 'admin' ? 'Admin Dashboard' : 'Dashboard';
      case 'jobs':
        return 'Job Openings';
      case 'rankings':
        return 'Candidates';
      case 'screening':
        return 'Resume Screening';
      case 'shortlist':
        return 'Shortlisted Candidates';
      case 'interviews':
        return 'Interviews';
      case 'result':
        return 'Candidate Profile';
      case 'analytics':
        return 'Analytics';
      case 'reports':
        return 'Reports & Exports';
      case 'history':
        return 'Screening History';
      case 'users':
        return 'User & Role Management';
      case 'activity':
        return 'Activity & Audit Logs';
      case 'settings':
        return 'Settings & Preferences';
      default:
        return 'Dashboard';
    }
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    setCurrentTab('rankings');
  };

  return (
    <header className="h-16 bg-white/90 dark:bg-[#0A0E1A]/90 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 gap-4 backdrop-blur-md transition-colors">
      {/* Left: Mobile Drawer Trigger & Current Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="font-semibold text-lg text-slate-900 dark:text-white tracking-tight truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center: Global Search Bar */}
      <form onSubmit={handleGlobalSearch} className="hidden sm:flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search jobs, candidates..."
            className="w-full pl-8 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </form>

      {/* Right: Actions, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors btn-interactive"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50 animate-dropdown text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-white">
                <span>Notifications</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  System Online
                </span>
              </div>
              <div className="py-2.5 space-y-2 text-slate-500 dark:text-slate-400">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#121A2F] border border-slate-100 dark:border-slate-800/80">
                  <div className="font-medium text-slate-800 dark:text-slate-200">ML Engine Ready</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">LinearSVC &amp; TF-IDF vectorizer loaded.</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#121A2F] border border-slate-100 dark:border-slate-800/80">
                  <div className="font-medium text-slate-800 dark:text-slate-200">Database Connected</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">SQLite persistence active at 127.0.0.1:8000.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121A2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm btn-interactive"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-12" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* Primary Screen CTA */}
        {currentTab !== 'screening' && (
          <button
            onClick={() => setCurrentTab('screening')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm btn-interactive"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screen</span>
          </button>
        )}

        {/* Recruiter Profile / Auth */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs transition-colors btn-interactive"
              title="Recruiter Account"
              aria-expanded={showUserMenu}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Profile'}
                  className="w-6 h-6 rounded-full object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'R'}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user?.full_name || 'Recruiter'}
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                  {user?.role || 'RECRUITER'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 animate-dropdown text-xs"
                onClick={() => setShowUserMenu(false)}
              >
                {/* User Info Header */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {user?.full_name || 'Recruiter'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </div>
                  {user?.company_name && (
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                      {user.company_name}
                    </div>
                  )}
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                    {user?.role || 'Recruiter'}
                  </span>
                </div>

                {/* Actions */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors font-medium mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm btn-interactive"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
