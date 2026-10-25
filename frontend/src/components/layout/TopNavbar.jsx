import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSearch,
  Star,
  Calendar,
  BarChart2,
  FileText,
  History,
  ShieldCheck,
  Activity,
  Settings as SettingsIcon,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LogIn,
  User,
  CheckCircle2,
  Cpu,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { hasPermission, formatRole } from '../../utils/rbac';
import { getHealthStatusApi, getScreeningHistoryApi } from '../../services/api';

export default function TopNavbar({ currentTab, setCurrentTab }) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Component states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [reportsMenuPosition, setReportsMenuPosition] = useState({ top: 0, left: 0, width: 224, placement: 'bottom' });

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const reportsButtonRef = useRef(null);
  const reportsDropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Position calculation for Reports dropdown portal
  const updateReportsMenuPosition = useCallback(() => {
    if (!reportsButtonRef.current) return;
    const rect = reportsButtonRef.current.getBoundingClientRect();

    // If button is hidden (display: none or 0 dimensions) or viewport < 1024px (mobile)
    if ((rect.width === 0 && rect.height === 0) || window.innerWidth < 1024) {
      setShowReportsMenu(false);
      return;
    }

    // If trigger button is completely scrolled out of the viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setShowReportsMenu(false);
      return;
    }

    const menuWidth = Math.min(224, window.innerWidth - 24);
    // Align right edge of menu to button's right edge
    let left = rect.right - menuWidth;
    // Keep within viewport horizontal bounds
    if (left < 12) {
      left = Math.max(12, rect.left);
    }
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12);
    }

    const menuHeight = reportsDropdownRef.current ? reportsDropdownRef.current.offsetHeight : 280;
    let top = rect.bottom + 8;
    let placement = 'bottom';

    // If bottom placement overflows viewport and there is sufficient room above, flip upward
    if (top + menuHeight > window.innerHeight - 12 && rect.top - menuHeight - 8 > 0) {
      top = Math.max(12, rect.top - menuHeight - 8);
      placement = 'top';
    }

    setReportsMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(menuWidth),
      placement
    });
  }, []);

  // Recalculate position on scroll (window or any scroll container via capture) and resize
  useEffect(() => {
    if (!showReportsMenu) return;

    updateReportsMenuPosition();

    let animationFrameId = null;
    const handleScrollOrResize = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        updateReportsMenuPosition();
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showReportsMenu, updateReportsMenuPosition]);

  const handleReportsToggle = (e) => {
    e.stopPropagation();
    if (currentTab !== 'reports') {
      setCurrentTab('reports');
    }
    if (!showReportsMenu) {
      updateReportsMenuPosition();
      setShowReportsMenu(true);
    } else {
      setShowReportsMenu(false);
    }
  };

  // Load real health & recent screening notification state
  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        const [health, screenings] = await Promise.allSettled([
          getHealthStatusApi(),
          getScreeningHistoryApi({ limit: 3 })
        ]);
        if (isMounted) {
          if (health.status === 'fulfilled' && health.value) {
            setHealthStatus(health.value);
          }
          if (screenings.status === 'fulfilled' && screenings.value?.screenings) {
            setRecentAlerts(screenings.value.screenings);
          }
        }
      } catch (err) {
        // graceful fallback
      }
    }
    loadStatus();
    return () => { isMounted = false; };
  }, []);

  // Close popovers when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchPopover(false);
      }

      // Check both trigger button and portal dropdown
      const isButtonClicked = reportsButtonRef.current && reportsButtonRef.current.contains(event.target);
      const isDropdownClicked = reportsDropdownRef.current && reportsDropdownRef.current.contains(event.target);
      if (!isButtonClicked && !isDropdownClicked) {
        setShowReportsMenu(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowReportsMenu(false);
        setShowSearchPopover(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Desktop visible primary navigation tabs: matches Screenshot 2 exactly
  // Core items: Dashboard, Jobs, Candidates, Screen Resumes, Shortlist (ending at Reports tab)
  const PRIMARY_CORE_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'rankings', label: 'Candidates', icon: Users },
    { id: 'screening', label: 'Screen Resumes', icon: FileSearch },
    { id: 'shortlist', label: 'Shortlist', icon: Star },
  ];

  // Secondary views accessible through Reports dropdown menu
  const SECONDARY_MENU_ITEMS = [
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'history', label: 'Screening History', icon: History },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Admin exclusive tabs accessible through Reports dropdown menu
  const ADMIN_MENU_ITEMS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: ShieldCheck },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
  ];

  // Filter according to role
  const visiblePrimary = PRIMARY_CORE_TABS.filter((item) =>
    hasPermission(user?.role, item.id)
  );

  const visibleSecondary = SECONDARY_MENU_ITEMS.filter((item) =>
    hasPermission(user?.role, item.id)
  );

  const visibleAdmin = ADMIN_MENU_ITEMS.filter((item) =>
    hasPermission(user?.role, item.id)
  );

  const isReportsActive = currentTab === 'reports' || ['interviews', 'history', 'settings', 'analytics', 'users', 'activity'].includes(currentTab);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchPopover(false);
    setCurrentTab('rankings');
  };

  // Real notification items count
  const isHealthy = healthStatus?.status === 'healthy';
  const notificationCount = (isHealthy ? 2 : 1) + (recentAlerts.length > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200 bg-[#F4F3FA]/95 dark:bg-[#070A13]/90 backdrop-blur-xl border-b border-[#EAE7F4] dark:border-white/[0.07]">
      <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 min-w-0">
        
        {/* =========================================================================
            LEFT: BRAND IDENTITY (PEOPLEXIO STYLE)
            ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 select-none">
          <button
            onClick={() => {
              setCurrentTab('dashboard');
              setShowReportsMenu(false);
            }}
            className="flex items-center gap-2 sm:gap-3 group text-left focus:outline-none"
            title="HireNova — Next-Gen Recruitment"
          >
            {/* Official Brand Logo Mark */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] p-1 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img src="/assets/hirenova-logo.png" alt="HireNova Logo" className="w-full h-full object-contain" draggable={false} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#1C1739] dark:text-white flex items-center gap-1 font-display whitespace-nowrap">
                HireNova
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C2D8] dark:bg-[#38BDF8] inline-block animate-pulse"></span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#736B92] dark:text-[#94A3B8] tracking-tight hidden xs:inline whitespace-nowrap">
                Next-Gen Recruitment
              </span>
            </div>
          </button>
        </div>

        {/* =========================================================================
            CENTER: HORIZONTAL NAVIGATION BAR (COMPACT DESKTOP PILL)
            Ending at Reports tab, centered with exact width & spacing from Screenshot 2
            ========================================================================= */}
        <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-1 sm:px-2">
          <div className="flex items-center gap-0.5 xl:gap-1 p-1 rounded-full bg-white/80 dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm shadow-purple-900/5 backdrop-blur-md">
            
            {/* Core Visible Tabs: Dashboard, Jobs, Candidates, Screen Resumes, Shortlist */}
            {visiblePrimary.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setShowReportsMenu(false);
                  }}
                  className={`relative px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-[#5B47E0] text-white shadow-sm shadow-[#5B47E0]/30 font-medium'
                      : 'text-[#5C5677] dark:text-[#94A3B8] hover:text-[#1C1739] dark:hover:text-white hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* 6th Tab: Reports ▾ dropdown trigger (ending at Reports tab, exactly as Screenshot 2) */}
            {hasPermission(user?.role, 'reports') && (
              <button
                ref={reportsButtonRef}
                onClick={handleReportsToggle}
                aria-haspopup="true"
                aria-expanded={showReportsMenu}
                aria-controls="reports-dropdown-menu"
                className={`relative px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight flex items-center gap-1 transition-all duration-200 select-none whitespace-nowrap ${
                  isReportsActive
                    ? 'bg-[#5B47E0] text-white shadow-sm shadow-[#5B47E0]/30 font-medium'
                    : 'text-[#5C5677] dark:text-[#94A3B8] hover:text-[#1C1739] dark:hover:text-white hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05]'
                }`}
                title="Reports & recruitment views"
              >
                <span>Reports</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${showReportsMenu ? 'rotate-180' : ''}`} />
              </button>
            )}

          </div>
        </nav>

        {/* =========================================================================
            RIGHT: GLOBAL CONTROLS, THEME TOGGLE, CTA, AVATAR (NEVER OVERFLOWS)
            Exact layout from Screenshot 2: Search Icon, Notifications, Theme, CTA, Profile
            ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
          
          {/* Compact search icon button matching Screenshot 2 */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearchPopover(!showSearchPopover)}
              className="p-2 rounded-full bg-white/80 dark:bg-[#0E1526]/80 text-[#5C5677] dark:text-slate-300 hover:text-[#1C1739] dark:hover:text-white border border-[#EAE7F4] dark:border-white/[0.08] hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05] transition-all shrink-0"
              title="Search candidates or jobs"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Search popover */}
            {showSearchPopover && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.1] rounded-2xl shadow-2xl p-2.5 z-50 animate-dropdown">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#736B92]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate, role, skill..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#F4F3FA] dark:bg-white/[0.05] border border-[#EAE7F4] dark:border-white/[0.08] text-[#1C1739] dark:text-white focus:outline-none"
                  />
                </form>
              </div>
            )}
          </div>

          {/* Real Notification Bell with Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full bg-white/80 dark:bg-[#0E1526]/80 text-[#5C5677] dark:text-slate-300 hover:text-[#1C1739] dark:hover:text-white border border-[#EAE7F4] dark:border-white/[0.08] hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05] transition-all shrink-0"
              title="System Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Dynamic notification count */}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5B47E0] text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
                {notificationCount}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.1] rounded-2xl shadow-2xl p-4 z-50 animate-dropdown text-xs backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF8] dark:border-white/[0.07] font-semibold text-[#1C1739] dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">System Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {isHealthy ? 'All Systems Online' : 'System Degraded'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#736B92] hover:text-[#1C1739] dark:hover:text-white text-[11px]"
                  >
                    Close
                  </button>
                </div>
                
                <div className="py-2.5 space-y-2">
                  {/* ML Engine Status */}
                  <div className="p-2.5 rounded-xl bg-[#F8F7FD] dark:bg-white/[0.03] border border-[#EAE7F4] dark:border-white/[0.05]">
                    <div className="flex items-center justify-between font-semibold text-[#1C1739] dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${healthStatus?.model_loaded ? 'text-emerald-500' : 'text-amber-500'}`} />
                        ML Resume Engine
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {healthStatus?.model_loaded ? 'Ready' : 'Not available'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-1">
                      {healthStatus?.model_loaded
                        ? 'LinearSVC & TF-IDF vectorizer loaded for 40/60 ATS scoring.'
                        : 'Resume scoring model is offline or initializing.'}
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className="p-2.5 rounded-xl bg-[#F8F7FD] dark:bg-white/[0.03] border border-[#EAE7F4] dark:border-white/[0.05]">
                    <div className="flex items-center justify-between font-semibold text-[#1C1739] dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#5B47E0]" />
                        Database Persistence
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {healthStatus?.database_connected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-1">
                      {healthStatus?.database_connected
                        ? `SQLite active at 127.0.0.1:8000 with ${healthStatus.total_corpus_candidates || 2484} candidates.`
                        : 'Database connection unavailable.'}
                    </div>
                  </div>

                  {/* Recent screening alert if available */}
                  {recentAlerts.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#F8F7FD] dark:bg-white/[0.03] border border-[#EAE7F4] dark:border-white/[0.05]">
                      <div className="flex items-center justify-between font-semibold text-[#1C1739] dark:text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <FileSearch className="w-3.5 h-3.5 text-indigo-500" />
                          Recent Screening Batch
                        </span>
                        <span className="text-[10px] text-[#5B47E0] dark:text-[#A78BFA] font-bold">
                          {Math.round(recentAlerts[0]?.ats_score || 0)}% ATS
                        </span>
                      </div>
                      <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-1 truncate">
                        {recentAlerts[0]?.candidate_name || 'Candidate'} evaluated for {recentAlerts[0]?.job_title || 'Role'}.
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setCurrentTab('history');
                    setShowNotifications(false);
                  }}
                  className="w-full mt-1 py-1.5 text-center text-xs font-semibold text-[#5B47E0] dark:text-[#A78BFA] hover:underline"
                >
                  View Screening History &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Sun/Moon Pill) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/80 dark:bg-[#0E1526]/80 text-[#5C5677] dark:text-slate-300 hover:text-[#5B47E0] dark:hover:text-[#A78BFA] border border-[#EAE7F4] dark:border-white/[0.08] hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05] transition-all shrink-0"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#5B47E0] transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Screen Resumes Action Button */}
          {currentTab !== 'screening' && (
            <button
              onClick={() => {
                setCurrentTab('screening');
                setShowReportsMenu(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#5B47E0] to-[#705CF6] hover:from-[#4E39D2] hover:to-[#6350E8] rounded-full shadow-md shadow-[#5B47E0]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Screen Resumes</span>
            </button>
          )}

          {/* Recruiter Avatar / Profile Menu */}
          {isAuthenticated ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-full bg-white/80 dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] hover:bg-[#F3F0FC] dark:hover:bg-white/[0.05] transition-all text-xs"
                title="Recruiter Account"
                aria-expanded={showUserMenu}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Profile'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-2 ring-[#5B47E0]/20"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#5B47E0] to-[#7B69EE] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'R'}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="font-bold text-xs text-[#1C1739] dark:text-white truncate max-w-[85px] 2xl:max-w-[110px]">
                    {user?.full_name ? user.full_name.split(' ')[0] : 'Recruiter'}
                  </span>
                  <span className="text-[9px] text-[#736B92] dark:text-slate-400 mt-0.5 capitalize">
                    {formatRole(user?.role)}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-[#736B92] dark:text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.1] rounded-2xl shadow-2xl p-2.5 z-50 animate-dropdown text-xs backdrop-blur-2xl">
                  <div className="p-2.5 border-b border-[#F0EDF8] dark:border-white/[0.07] mb-1">
                    <div className="font-bold text-[#1C1739] dark:text-white text-sm truncate">
                      {user?.full_name || 'Recruiter'}
                    </div>
                    <div className="text-[11px] text-[#736B92] dark:text-slate-400 truncate mt-0.5">
                      {user?.email || 'recruiter@hirenova.ai'}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#ECE9FD] dark:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] text-[10px] font-bold">
                        {formatRole(user?.role)}
                      </span>
                      {user?.company_name && (
                        <span className="text-[10px] text-[#736B92] dark:text-slate-400 truncate font-medium">
                          {user.company_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#5C5677] dark:text-slate-200 hover:bg-[#F4F3FA] dark:hover:bg-white/[0.06] text-left transition-colors font-medium"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-[#5B47E0]" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors font-semibold mt-1"
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
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#5B47E0] to-[#7B69EE] hover:opacity-95 rounded-full shadow-sm shadow-[#5B47E0]/20 transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Trigger (Visible on < 1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-white/80 dark:bg-[#0E1526]/80 text-[#5C5677] dark:text-slate-300 border border-[#EAE7F4] dark:border-white/[0.08] shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE & TABLET DRAWER
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EAE7F4] dark:border-white/[0.08] bg-white/95 dark:bg-[#070A13]/98 backdrop-blur-2xl p-4 space-y-3 animate-dropdown shadow-2xl">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#736B92]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, candidates, skills..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-full bg-[#F4F3FA] dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.08] text-[#1C1739] dark:text-white"
            />
          </form>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[...visiblePrimary, ...visibleSecondary, ...visibleAdmin].map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                    setShowReportsMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-[#5B47E0] text-white shadow-sm'
                      : 'text-[#5C5677] dark:text-slate-300 hover:bg-[#F4F3FA] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Preferences */}
          <div className="pt-2 border-t border-[#F0EDF8] dark:border-white/[0.08] flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setCurrentTab('settings');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 font-semibold text-[#5C5677] dark:text-slate-300"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 font-bold text-[#5B47E0] dark:text-[#A78BFA]"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PORTAL: REPORTS & TOOLS DROPDOWN MENU
          Rendered directly into document.body to prevent clipping from overflow,
          stacking context issues, or z-index conflicts. Tracks trigger button on scroll & resize.
          ========================================================================= */}
      {showReportsMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={reportsDropdownRef}
          id="reports-dropdown-menu"
          role="menu"
          aria-label="Reports and recruitment views"
          style={{
            position: 'fixed',
            top: `${reportsMenuPosition.top}px`,
            left: `${reportsMenuPosition.left}px`,
            width: `${reportsMenuPosition.width}px`,
            transformOrigin: reportsMenuPosition.placement === 'top' ? 'bottom right' : 'top right',
          }}
          className="z-[9999] rounded-2xl bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.1] shadow-2xl p-1.5 animate-dropdown backdrop-blur-2xl max-h-[calc(100vh-100px)] overflow-y-auto"
        >
          {/* Secondary recruitment views */}
          {visibleSecondary.length > 0 && (
            <>
              <div className="px-2.5 py-1 text-[10px] font-bold text-[#736B92] dark:text-slate-400 uppercase tracking-wider">
                Recruitment Views
              </div>
              {visibleSecondary.map(item => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => {
                    setCurrentTab(item.id);
                    setShowReportsMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    currentTab === item.id
                      ? 'bg-[#5B47E0] text-white font-semibold'
                      : 'text-[#5C5677] dark:text-slate-300 hover:bg-[#F4F3FA] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 opacity-70" />
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Admin items if authorized */}
          {visibleAdmin.length > 0 && (
            <>
              <div className="mt-1 pt-1 border-t border-[#F0EDF8] dark:border-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-[#736B92] dark:text-slate-400 uppercase tracking-wider">
                Administration
              </div>
              {visibleAdmin.map(item => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => {
                    setCurrentTab(item.id);
                    setShowReportsMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    currentTab === item.id
                      ? 'bg-[#5B47E0] text-white font-semibold'
                      : 'text-[#5C5677] dark:text-slate-300 hover:bg-[#F4F3FA] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 opacity-70" />
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </header>
  );
}
