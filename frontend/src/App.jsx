import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AuthModal from './components/auth/AuthModal';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import ResumeScreening from './pages/ResumeScreening';
import ScreeningHistory from './pages/ScreeningHistory';
import JobManagement from './pages/JobManagement';
import CandidateResult from './pages/CandidateResult';
import CandidateRankings from './pages/CandidateRankings';
import Shortlist from './pages/Shortlist';
import Interviews from './pages/Interviews';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import SettingsPage from './pages/Settings';
import LandingPage from './pages/LandingPage';
import AccessRestricted from './components/common/AccessRestricted';
import { hasPermission, getRoleDefaultTab } from './utils/rbac';

function resolveTabFromUrl() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace('#', '').trim();

  // Intercept direct URLs & Admin paths per Requirement 7
  if (path.includes('/admin/users') || path === '/users' || hash === 'users') return 'users';
  if (path.includes('/admin/activity') || path === '/activity' || hash === 'activity') return 'activity';
  if (path.includes('/admin/settings') || path === '/settings' || hash === 'settings') return 'settings';
  if (path.includes('/jobs') || hash === 'jobs') return 'jobs';
  if (path.includes('/screening') || hash === 'screening') return 'screening';
  if (path.includes('/candidates') || path.includes('/rankings') || hash === 'candidates' || hash === 'rankings') return 'rankings';
  if (path.includes('/shortlist') || hash === 'shortlist') return 'shortlist';
  if (path.includes('/interviews') || hash === 'interviews') return 'interviews';
  if (path.includes('/analytics') || hash === 'analytics') return 'analytics';
  if (path.includes('/reports') || hash === 'reports') return 'reports';
  if (path.includes('/history') || hash === 'history') return 'history';
  if (hash === 'landing') return 'landing';

  try {
    const stored = localStorage.getItem('hirenova_active_tab') || localStorage.getItem('recruitx_active_tab') || localStorage.getItem('reqretx_active_tab');
    if (stored && stored !== 'landing') return stored;
  } catch (e) {
    // Ignore storage errors
  }

  return 'dashboard';
}

function AppContent() {
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();

  const [currentTab, setCurrentTab] = useState(() => resolveTabFromUrl());
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [latestAnalysisResult, setLatestAnalysisResult] = useState(null);
  const [selectedJobForScreening, setSelectedJobForScreening] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Set browser title to exactly "HireNova — Next-Gen Recruitment"
  useEffect(() => {
    document.title = 'HireNova — Next-Gen Recruitment';
  }, []);

  // Sync with browser navigation & direct URLs
  useEffect(() => {
    const onLocationChange = () => {
      const tab = resolveTabFromUrl();
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  // Persist currentTab when user switches tabs and update hash
  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    try {
      localStorage.setItem('hirenova_active_tab', newTab);
      if (window.location.hash !== `#${newTab}`) {
        window.history.pushState(null, '', `#${newTab}`);
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  // When a resume screening analysis is finished, switch to candidate result tab
  const handleAnalysisComplete = (result) => {
    setLatestAnalysisResult(result);
    setSelectedCandidateId(result.id);
    handleTabChange('result');
  };

  // When user selects a candidate anywhere in the app
  const handleSelectCandidate = (candidateId) => {
    setLatestAnalysisResult(null);
    setSelectedCandidateId(candidateId);
    handleTabChange('result');
  };

  // Render public marketing landing website only if specifically requested
  if (currentTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-200">
        <LandingPage
          onLaunchApp={(targetTab) => handleTabChange(targetTab || 'dashboard')}
          onOpenAuth={openAuthModal}
        />
        <AuthModal onLoginSuccess={() => handleTabChange('dashboard')} />
      </div>
    );
  }

  // Check RBAC permission for the requested view
  const isAuthorized = hasPermission(user?.role, currentTab);

  // Render operational recruiter application workspace
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Desktop Navigation Rail */}
      <div className="hidden md:flex shrink-0 relative z-20">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            handleTabChange(tab);
            setMobileSidebarOpen(false);
          }}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-64 h-full bg-[#0A0E1A] shadow-2xl border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={(tab) => {
                handleTabChange(tab);
                setMobileSidebarOpen(false);
              }}
              isCollapsed={false}
              setIsCollapsed={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Dynamic Page Views with Strict RBAC Authorization */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-transparent">
          <div key={currentTab} className="max-w-7xl mx-auto animate-page-enter">
            {!isAuthorized ? (
              <AccessRestricted
                currentRole={user?.role}
                onBackToDashboard={() => handleTabChange('dashboard')}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <Dashboard
                    setCurrentTab={handleTabChange}
                    setSelectedCandidateId={handleSelectCandidate}
                  />
                )}

                {currentTab === 'jobs' && (
                  <JobManagement
                    setCurrentTab={handleTabChange}
                    setSelectedJobForScreening={setSelectedJobForScreening}
                  />
                )}

                {(currentTab === 'rankings' || currentTab === 'candidates') && (
                  <CandidateRankings
                    onSelectCandidate={handleSelectCandidate}
                  />
                )}

                {currentTab === 'screening' && (
                  <ResumeScreening
                    onAnalysisComplete={handleAnalysisComplete}
                    initialJob={selectedJobForScreening}
                  />
                )}

                {currentTab === 'shortlist' && (
                  <Shortlist
                    onSelectCandidate={handleSelectCandidate}
                    setCurrentTab={handleTabChange}
                  />
                )}

                {currentTab === 'interviews' && (
                  <Interviews
                    onSelectCandidate={handleSelectCandidate}
                  />
                )}

                {currentTab === 'analytics' && (
                  <Analytics
                    setCurrentTab={handleTabChange}
                  />
                )}

                {currentTab === 'reports' && (
                  <Reports />
                )}

                {currentTab === 'users' && (
                  <UserManagement />
                )}

                {currentTab === 'activity' && (
                  <ActivityLogs />
                )}

                {currentTab === 'settings' && (
                  <SettingsPage />
                )}

                {currentTab === 'result' && (
                  <CandidateResult
                    candidateId={selectedCandidateId}
                    analysisResult={latestAnalysisResult}
                    setCurrentTab={handleTabChange}
                  />
                )}

                {currentTab === 'history' && (
                  <ScreeningHistory
                    onSelectCandidate={handleSelectCandidate}
                    setCurrentTab={handleTabChange}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Recruiter Authentication Modal */}
      <AuthModal onLoginSuccess={() => handleTabChange('dashboard')} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
