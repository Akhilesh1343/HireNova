import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AuthModal from './components/auth/AuthModal';
import TopNavbar from './components/layout/TopNavbar';
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
    <div className="min-h-screen flex flex-col bg-[#F4F3FA] dark:bg-[#070A13] text-[#1C1739] dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden w-full">
      {/* Top Horizontal Navigation Bar (Reference Image 1: Peoplexio Layout) */}
      <TopNavbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">
        <div key={currentTab} className="animate-page-enter">
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
                  setSelectedJobForScreening={setSelectedJobForScreening}
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
