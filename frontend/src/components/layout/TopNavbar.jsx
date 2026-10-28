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
import BrandLogo from '../common/BrandLogo';

export default function TopNavbar({ currentTab, setCurrentTab }) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Component states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ top: 0, left: 0, width: 224, placement: 'bottom' });

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Position calculation for More dropdown portal
  const updateMoreMenuPosition = useCallback(() => {
    if (!moreButtonRef.current) return;
    const rect = moreButtonRef.current.getBoundingClientRect();

    // If button is hidden (display: none or 0 dimensions) or viewport < 1024px (mobile)
    if ((rect.width === 0 && rect.height === 0) || window.innerWidth < 1024) {
      setShowMoreMenu(false);
      return;
    }

    // If trigger button is completely scrolled out of the viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setShowMoreMenu(false);
      return;
    }

    const menuWidth = Math.min(224, window.innerWidth - 24);
    // Align menu nicely under the button:
    let left = rect.left + (rect.width / 2) - (menuWidth / 2);
    // Keep within viewport horizontal bounds
    if (left < 12) {
      left = 12;
    }
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12);
    }

    const menuHeight = moreDropdownRef.current ? moreDropdownRef.current.offsetHeight : 280;
    let top = rect.bottom + 8;
    let placement = 'bottom';

    // If bottom placement overflows viewport and there is sufficient room above, flip upward
    if (top + menuHeight > window.innerHeight - 12 && rect.top - menuHeight - 8 > 0) {
      top = Math.max(12, rect.top - menuHeight - 8);
      placement = 'top';
    }

    setMoreMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(menuWidth),
      placement
    });
  }, []);

  // Recalculate position on scroll (window or any scroll container via capture) and resize
  useEffect(() => {
    if (!showMoreMenu) return;

    updateMoreMenuPosition();

    let animationFrameId = null;
    const handleScrollOrResize = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        updateMoreMenuPosition();
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showMoreMenu, updateMoreMenuPosition]);

  const handleMoreToggle = (e) => {
    e.stopPropagation();
    if (!showMoreMenu) {
      updateMoreMenuPosition();
      setShowMoreMenu(true);
    } else {
      setShowMoreMenu(false);
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
      const isButtonClicked = moreButtonRef.current && moreButtonRef.current.contains(event.target);
      const isDropdownClicked = moreDropdownRef.current && moreDropdownRef.current.contains(event.target);
      if (!isButtonClicked && !isDropdownClicked) {
        setShowMoreMenu(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowMoreMenu(false);
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

  // Secondary views accessible through More dropdown menu
  const SECONDARY_MENU_ITEMS = [
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'history', label: 'Screening History', icon: History },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Admin exclusive tabs accessible through More dropdown menu
  const ADMIN_MENU_ITEMS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: ShieldCheck },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
  ];

  // Tab navigation handler with auth gate
  const handleTabClick = (tabId) => {
    if (!isAuthenticated && tabId !== 'dashboard') {
      openAuthModal('login', '', tabId);
      setShowMoreMenu(false);
      setMobileMenuOpen(false);
      return;
    }
    setCurrentTab(tabId);
    setShowMoreMenu(false);
    setMobileMenuOpen(false);
  };

  // Filter according to role:
  // For unauthenticated visitors, show the primary navigation & more menu previews so they can explore & trigger authentication.
  // For authenticated users, strictly filter to the user's role permissions.
  const visiblePrimary = isAuthenticated
    ? PRIMARY_CORE_TABS.filter((item) => hasPermission(user?.role, item.id))
    : PRIMARY_CORE_TABS;

  const visibleSecondary = isAuthenticated
    ? SECONDARY_MENU_ITEMS.filter((item) => hasPermission(user?.role, item.id))
    : SECONDARY_MENU_ITEMS;

  const visibleAdmin = isAuthenticated
    ? ADMIN_MENU_ITEMS.filter((item) => hasPermission(user?.role, item.id))
    : [];

  const isMoreActive = ['reports', 'history', 'interviews', 'settings', 'analytics', 'users', 'activity'].includes(currentTab);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchPopover(false);
    handleTabClick('rankings');
  };

  // Real notification items count
  const isHealthy = healthStatus?.status === 'healthy';
  const notificationCount = (isHealthy ? 2 : 1) + (recentAlerts.length > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200 bg-[#050807]/90 backdrop-blur-xl border-b border-emerald-500/10 text-[#F8FAFC]">
      <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 min-w-0">
        
        {/* =========================================================================
            LEFT: BRAND IDENTITY
            ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 select-none">
          <button
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none"
            title="HireNova"
          >
            {/* Official Brand Logo Mark */}
            <BrandLogo
              withContainer
              containerClassName="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform duration-200"
              className="w-full h-full"
            />
            <div className="flex flex-col justify-center leading-tight">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#F8FAFC] flex items-center font-display whitespace-nowrap">
                HireNova
              </span>
            </div>
          </button>
        </div>

        {/* =========================================================================
            CENTER: HORIZONTAL NAVIGATION BAR (COMPACT DESKTOP PILL)
            ========================================================================= */}
        <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-1 sm:px-2">
          <div className="flex items-center gap-0.5 xl:gap-1 p-1 rounded-full bg-[#0B1210]/90 border border-emerald-500/15 shadow-sm backdrop-blur-md">
            
            {/* Core Visible Tabs: Dashboard, Jobs, Candidates, Screen Resumes, Shortlist */}
            {visiblePrimary.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-[#059669] text-white shadow-sm shadow-emerald-700/30 font-semibold border border-emerald-400/30'
                      : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#131F1B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* 6th Tab: More ▾ dropdown trigger */}
            {(visibleSecondary.length > 0 || visibleAdmin.length > 0) && (
              <button
                ref={moreButtonRef}
                onClick={handleMoreToggle}
                aria-haspopup="true"
                aria-expanded={showMoreMenu}
                aria-controls="more-dropdown-menu"
                className={`relative px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight flex items-center gap-1 transition-all duration-200 select-none whitespace-nowrap ${
                  isMoreActive
                    ? 'bg-[#059669] text-white shadow-sm shadow-emerald-700/30 font-semibold border border-emerald-400/30'
                    : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#131F1B]'
                }`}
                title="More recruitment views & options"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>
            )}

          </div>
        </nav>

        {/* =========================================================================
            RIGHT: GLOBAL CONTROLS, THEME TOGGLE, CTA, AVATAR (NEVER OVERFLOWS)
            Essential actions on mobile: Search, Notifications, Theme, Hamburger.
            Desktop: Full controls with Screen Resumes CTA and Profile.
            ========================================================================= */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
          
          {/* Compact search icon button */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearchPopover(!showSearchPopover)}
              className="p-1.5 xs:p-2 rounded-full bg-[#0B1210] text-[#94A3A8] hover:text-[#34D399] border border-emerald-500/15 hover:bg-[#131F1B] transition-all shrink-0"
              title="Search candidates or jobs"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Search popover - responsive positioning so it never overflows */}
            {showSearchPopover && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-72 max-w-[calc(100vw-24px)] bg-[#0B1210] border border-emerald-500/20 rounded-2xl shadow-2xl p-2.5 z-50 animate-dropdown text-[#F8FAFC]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3A8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate, role, skill..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#050807] border border-emerald-500/20 text-[#F8FAFC] placeholder:text-[#94A3A8]/60 focus:outline-none focus:border-[#34D399]"
                  />
                </form>
              </div>
            )}
          </div>

          {/* Real Notification Bell with Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 xs:p-2 rounded-full bg-[#0B1210] text-[#94A3A8] hover:text-[#34D399] border border-emerald-500/15 hover:bg-[#131F1B] transition-all shrink-0"
              title="System Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {/* Dynamic notification count */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#059669] text-white font-bold text-[8px] sm:text-[9px] flex items-center justify-center shadow-sm">
                {notificationCount}
              </span>
            </button>

            {showNotifications && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-80 max-w-[calc(100vw-24px)] bg-[#0B1210] border border-emerald-500/20 rounded-2xl shadow-2xl p-3.5 sm:p-4 z-50 animate-dropdown text-xs backdrop-blur-2xl max-h-[80vh] overflow-y-auto text-[#F8FAFC]">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] font-semibold text-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">System Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      {isHealthy ? 'All Systems Online' : 'System Degraded'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#94A3A8] hover:text-white text-[11px]"
                  >
                    Close
                  </button>
                </div>
                
                <div className="py-2.5 space-y-2">
                  {/* ML Engine Status */}
                  <div className="p-2.5 rounded-xl bg-[#131F1B]/60 border border-emerald-500/15">
                    <div className="flex items-center justify-between font-semibold text-[#F8FAFC]">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${healthStatus?.model_loaded ? 'text-[#34D399]' : 'text-amber-400'}`} />
                        ML Resume Engine
                      </span>
                      <span className="text-[10px] text-[#34D399] font-bold">
                        {healthStatus?.model_loaded ? 'Ready' : 'Not available'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94A3A8] mt-1">
                      {healthStatus?.model_loaded
                        ? 'LinearSVC & TF-IDF vectorizer loaded for 40/60 ATS scoring.'
                        : 'Resume scoring model is offline or initializing.'}
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className="p-2.5 rounded-xl bg-[#131F1B]/60 border border-emerald-500/15">
                    <div className="flex items-center justify-between font-semibold text-[#F8FAFC]">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#34D399]" />
                        Database Persistence
                      </span>
                      <span className="text-[10px] text-[#34D399] font-bold">
                        {healthStatus?.database_connected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94A3A8] mt-1">
                      {healthStatus?.database_connected
                        ? `SQLite active at 127.0.0.1:8000 with ${healthStatus.total_corpus_candidates || 2484} candidates.`
                        : 'Database connection unavailable.'}
                    </div>
                  </div>

                  {/* Recent screening alert if available */}
                  {recentAlerts.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#131F1B]/60 border border-emerald-500/15">
                      <div className="flex items-center justify-between font-semibold text-[#F8FAFC]">
                        <span className="flex items-center gap-1.5">
                          <FileSearch className="w-3.5 h-3.5 text-[#34D399]" />
                          Recent Screening Batch
                        </span>
                        <span className="text-[10px] text-[#34D399] font-bold">
                          {Math.round(recentAlerts[0]?.ats_score || 0)}% ATS
                        </span>
                      </div>
                      <div className="text-[11px] text-[#94A3A8] mt-1 truncate">
                        {recentAlerts[0]?.candidate_name || 'Candidate'} evaluated for {recentAlerts[0]?.job_title || 'Role'}.
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleTabClick('history');
                    setShowNotifications(false);
                  }}
                  className="w-full mt-1 py-1.5 text-center text-xs font-semibold text-[#34D399] hover:underline"
                >
                  View Screening History &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Sun/Moon Pill) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 xs:p-2 rounded-full bg-[#0B1210] text-[#94A3A8] hover:text-[#34D399] border border-emerald-500/15 hover:bg-[#131F1B] transition-all shrink-0"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#34D399] transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Screen Resumes Action Button - Visible on md+ for authorized roles or guest prompt */}
          {currentTab !== 'screening' && (!isAuthenticated || hasPermission(user?.role, 'screening')) && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login', '', 'screening');
                  return;
                }
                setCurrentTab('screening');
                setShowMoreMenu(false);
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-full shadow-md shadow-emerald-700/25 border border-emerald-400/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Screen Resumes</span>
            </button>
          )}

          {/* User Account / Sign In Controls */}
          {isAuthenticated ? (
            <div className="relative shrink-0 hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-full bg-[#0B1210] border border-emerald-500/15 hover:bg-[#131F1B] transition-all text-xs"
                title="Account Menu"
                aria-expanded={showUserMenu}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Profile'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#059669] to-[#34D399] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="font-bold text-xs text-[#F8FAFC] truncate max-w-[85px] 2xl:max-w-[110px]">
                    {user?.full_name ? user.full_name.split(' ')[0] : 'User'}
                  </span>
                  <span className="text-[9px] text-[#94A3A8] mt-0.5 capitalize">
                    {formatRole(user?.role)}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-[#94A3A8] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-24px)] bg-[#0B1210] border border-emerald-500/20 rounded-2xl shadow-2xl p-2.5 z-50 animate-dropdown text-xs backdrop-blur-2xl text-[#F8FAFC]">
                  <div className="p-2.5 border-b border-white/[0.08] mb-1">
                    <div className="font-bold text-[#F8FAFC] text-sm truncate">
                      {user?.full_name || 'User'}
                    </div>
                    <div className="text-[11px] text-[#94A3A8] truncate mt-0.5">
                      {user?.email || 'user@hirenova.ai'}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-[#34D399] text-[10px] font-bold border border-emerald-500/25">
                        {formatRole(user?.role)}
                      </span>
                      {user?.company_name && (
                        <span className="text-[10px] text-[#94A3A8] truncate font-medium">
                          {user.company_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleTabClick('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#94A3A8] hover:text-white hover:bg-[#131F1B] text-left transition-colors font-medium"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 text-left transition-colors font-semibold mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-[#94A3A8] hover:text-[#34D399] bg-[#0B1210] border border-emerald-500/20 hover:bg-[#131F1B] rounded-full transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}


          {/* Mobile Hamburger Trigger (Visible on < 1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 xs:p-2 rounded-full bg-[#0B1210] text-[#94A3A8] border border-emerald-500/20 hover:text-[#34D399] hover:bg-[#131F1B] shrink-0 transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#34D399]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE & TABLET DRAWER (Screens < 1024px)
          All menu items (Dashboard, Jobs, Candidates, Screen Resumes, Shortlist,
          Reports & Secondary Views) organized in a clean scrollable drawer with
          no horizontal overflow or clipping. Always respects dark emerald theme.
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-500/20 bg-[#0B1210] text-[#F8FAFC] backdrop-blur-2xl p-4 space-y-4 animate-dropdown shadow-2xl max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain mobile-nav-drawer">
          
          {/* User Account Bar in Mobile Drawer */}
          {isAuthenticated ? (
            <div className="p-3 rounded-2xl bg-[#131F1B] border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Profile'}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#059669] to-[#34D399] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'R'}
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <div className="font-bold text-xs text-[#F8FAFC] truncate">
                    {user?.full_name || 'Recruiter'}
                  </div>
                  <div className="text-[10px] text-[#94A3A8] truncate mt-0.5">
                    {user?.email || 'recruiter@hirenova.ai'}
                  </div>
                  <span className="inline-block px-1.5 py-0.2 mt-1 rounded-full bg-emerald-950/40 text-[#34D399] text-[9px] font-bold border border-emerald-500/25">
                    {formatRole(user?.role)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/30 shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-[#F8FAFC] bg-[#131F1B] border border-emerald-500/20 hover:bg-[#182A24] hover:text-[#34D399] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => {
                  openAuthModal('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] shadow-md shadow-emerald-700/25 transition-all"
              >
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Quick Action CTA: Screen Resumes */}
          {currentTab !== 'screening' && (!isAuthenticated || hasPermission(user?.role, 'screening')) && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login', '', 'screening');
                  setMobileMenuOpen(false);
                  return;
                }
                setCurrentTab('screening');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md shadow-emerald-700/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Screen Resumes &amp; AI Match</span>
            </button>
          )}


          {/* Core Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider px-1 mb-1.5">
              Core Workspace
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visiblePrimary.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      isActive
                        ? 'bg-[#059669] text-white shadow-md shadow-emerald-700/30 font-semibold border border-emerald-400/30'
                        : 'text-[#94A3A8] bg-[#131F1B] hover:bg-[#182A24] hover:text-[#F8FAFC] border border-emerald-500/15'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#34D399]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Views & Reports in More Menu */}
          {(visibleSecondary.length > 0 || visibleAdmin.length > 0) && (
            <div className="space-y-1 pt-2 border-t border-white/[0.08]">
              <div className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider px-1 mb-1.5">
                More Options &amp; Management
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...visibleSecondary, ...visibleAdmin].map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                        isActive
                          ? 'bg-[#059669] text-white shadow-md shadow-emerald-700/30 font-semibold border border-emerald-400/30'
                          : 'text-[#94A3A8] bg-[#131F1B] hover:bg-[#182A24] hover:text-[#F8FAFC] border border-emerald-500/15'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#34D399]'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Preferences & System Health */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-medium text-[#94A3A8]">
                {isHealthy ? 'API Online' : 'System Degraded'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 font-bold text-[#34D399] px-2.5 py-1.5 rounded-lg hover:bg-[#131F1B] transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PORTAL: MORE DROPDOWN MENU
          Rendered directly into document.body to prevent clipping from overflow,
          stacking context issues, or z-index conflicts. Tracks trigger button on scroll & resize.
          ========================================================================= */}
      {showMoreMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={moreDropdownRef}
          id="more-dropdown-menu"
          role="menu"
          aria-label="More navigation and recruitment views"
          style={{
            position: 'fixed',
            top: `${moreMenuPosition.top}px`,
            left: `${moreMenuPosition.left}px`,
            width: `${moreMenuPosition.width}px`,
            transformOrigin: moreMenuPosition.placement === 'top' ? 'bottom center' : 'top center',
          }}
          className="z-[9999] rounded-2xl bg-[#0B1210] border border-emerald-500/20 shadow-2xl p-1.5 animate-dropdown backdrop-blur-2xl max-h-[calc(100vh-100px)] overflow-y-auto text-[#F8FAFC]"
        >
          {/* Secondary recruitment views */}
          {visibleSecondary.length > 0 && (
            <>
              <div className="px-2.5 py-1 text-[10px] font-bold text-[#34D399] uppercase tracking-wider">
                Recruitment Views
              </div>
              {visibleSecondary.map(item => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    currentTab === item.id
                      ? 'bg-[#059669] text-white font-semibold'
                      : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#131F1B]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 opacity-80 text-[#34D399]" />
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Admin items if authorized */}
          {visibleAdmin.length > 0 && (
            <>
              <div className="mt-1 pt-1 border-t border-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#34D399] uppercase tracking-wider">
                Administration
              </div>
              {visibleAdmin.map(item => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    currentTab === item.id
                      ? 'bg-[#059669] text-white font-semibold'
                      : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#131F1B]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 opacity-80 text-[#34D399]" />
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
