import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Briefcase,
  FileSearch,
  Users,
  Star,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Play,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Check,
  Award,
  AlertCircle,
  Sparkles,
  Lock,
  Target,
  BarChart3,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { RecommendationBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatRole } from '../utils/rbac';
import {
  getDashboardSummaryApi,
  getJobsApi,
  getScreeningHistoryApi,
  getInterviewsApi,
  getHealthStatusApi
} from '../services/api';

export default function Dashboard({
  setCurrentTab,
  setSelectedCandidateId,
  setSelectedJobForScreening
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { theme, isDark } = useTheme();

  // State management for live API data
  const [summaryData, setSummaryData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive UI states
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Helper for role-restricted navigation
  const handleNavigate = (tabId, jobData = null) => {
    if (!isAuthenticated) {
      openAuthModal('login', '', tabId);
      return;
    }
    if (jobData && setSelectedJobForScreening) {
      setSelectedJobForScreening(jobData);
    }
    setCurrentTab(tabId);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // Fetch public aggregate summary & health status (always works for guests and auth)
        const [summaryRes, healthRes] = await Promise.allSettled([
          getDashboardSummaryApi(),
          getHealthStatusApi()
        ]);

        if (isMounted) {
          if (summaryRes.status === 'fulfilled' && summaryRes.value) {
            setSummaryData(summaryRes.value);
          }
          if (healthRes.status === 'fulfilled' && healthRes.value) {
            setHealth(healthRes.value);
          }
        }

        // If authenticated, also fetch detailed authenticated user records
        if (isAuthenticated) {
          const [jobsRes, screeningsRes, interviewsRes] = await Promise.allSettled([
            getJobsApi(),
            getScreeningHistoryApi({ limit: 6, sortBy: 'created_at', sortOrder: 'desc' }),
            getInterviewsApi()
          ]);

          if (isMounted) {
            if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
              setJobs(jobsRes.value);
            }
            if (screeningsRes.status === 'fulfilled' && screeningsRes.value?.screenings) {
              setRecentScreenings(screeningsRes.value.screenings);
            }
            if (interviewsRes.status === 'fulfilled' && Array.isArray(interviewsRes.value)) {
              setInterviews(interviewsRes.value);
            }
          }
        } else {
          if (isMounted) {
            setJobs([]);
            setRecentScreenings([]);
            setInterviews([]);
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Role detection
  const userRole = user?.role ? user.role.toLowerCase() : null;
  const isRecruiter = userRole === 'recruiter';
  const isHiringManager = userRole === 'hiring_manager';
  const isHrLead = userRole === 'hr_lead';
  const isAdmin = userRole === 'admin';

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Guest';
  const formattedRoleName = user?.role ? formatRole(user.role) : 'Visitor';

  // Metrics from verified database statistics only
  const totalCandidates = Number(summaryData?.total_candidates) || 0;
  const activeJobsCount = summaryData?.total_jobs !== undefined && summaryData?.total_jobs !== null
    ? Number(summaryData.total_jobs)
    : jobs.length;
  const screenedCount = summaryData?.total_screenings !== undefined && summaryData?.total_screenings !== null
    ? Number(summaryData.total_screenings)
    : recentScreenings.length;
  const shortlistedCount = Number(summaryData?.total_shortlisted) || 0;
  const avgAtsScore = summaryData?.average_ats_score !== undefined && summaryData?.average_ats_score !== null
    ? Math.round(Number(summaryData.average_ats_score) || 0)
    : null;
  const isSystemOnline = (health?.status === 'healthy') || (summaryData?.ml_engine_status === 'online');

  // Weekly screening activity from genuine database timestamps
  const weeklyData = useMemo(() => {
    if (summaryData?.weekly_activity && Array.isArray(summaryData.weekly_activity) && summaryData.weekly_activity.length > 0) {
      const maxCount = Math.max(...summaryData.weekly_activity.map(d => Number(d?.count) || 0), 1);
      return summaryData.weekly_activity.map(d => {
        const count = Number(d?.count) || 0;
        return {
          day: d?.day || '',
          count,
          isPeak: maxCount > 0 && count === maxCount && count > 0
        };
      });
    }
    // Fallback 7-day empty skeleton
    return [
      { day: 'Mon', count: 0, isPeak: false },
      { day: 'Tue', count: 0, isPeak: false },
      { day: 'Wed', count: 0, isPeak: false },
      { day: 'Thu', count: 0, isPeak: false },
      { day: 'Fri', count: 0, isPeak: false },
      { day: 'Sat', count: 0, isPeak: false },
      { day: 'Sun', count: 0, isPeak: false },
    ];
  }, [summaryData]);

  // Pipeline funnel stages from genuine database counts
  const pipeline = useMemo(() => {
    const applied = Number(summaryData?.pipeline_stages?.applied ?? totalCandidates) || 0;
    const screened = Number(summaryData?.pipeline_stages?.screened ?? screenedCount) || 0;
    const shortlisted = Number(summaryData?.pipeline_stages?.shortlisted ?? shortlistedCount) || 0;
    const interviewed = Number(summaryData?.pipeline_stages?.interviewed ?? interviews.length) || 0;

    return [
      {
        id: 'applied',
        label: 'Applied',
        count: applied,
        color: 'from-emerald-700 to-emerald-500',
        textColor: 'text-[#34D399]',
        bgSubtle: 'bg-emerald-950/40'
      },
      {
        id: 'screened',
        label: 'Screened',
        count: screened,
        color: 'from-emerald-600 to-teal-400',
        textColor: 'text-teal-300',
        bgSubtle: 'bg-teal-950/40'
      },
      {
        id: 'shortlisted',
        label: 'Shortlisted',
        count: shortlisted,
        color: 'from-teal-500 to-emerald-400',
        textColor: 'text-emerald-300',
        bgSubtle: 'bg-emerald-950/50'
      },
      {
        id: 'interviewed',
        label: 'Interviewing',
        count: interviewed,
        color: 'from-emerald-500 to-[#34D399]',
        textColor: 'text-[#A7F3D0]',
        bgSubtle: 'bg-emerald-950/60'
      }
    ];
  }, [summaryData, totalCandidates, screenedCount, shortlistedCount, interviews]);

  // Categories from genuine DB distribution (safely handles either 'name' or 'category' key)
  const categoriesList = useMemo(() => {
    if (summaryData?.category_distribution && Array.isArray(summaryData.category_distribution)) {
      return summaryData.category_distribution.slice(0, 5).map(item => {
        const catName = String(item?.name || item?.category || 'General');
        return {
          id: catName.toLowerCase().replace(/\s+/g, '_'),
          name: catName,
          count: Number(item?.count) || 0
        };
      });
    }
    return [];
  }, [summaryData]);

  // Set initial expanded category
  useEffect(() => {
    if (categoriesList.length > 0 && !expandedCategory) {
      setExpandedCategory(categoriesList[0].id);
    }
  }, [categoriesList, expandedCategory]);

  return (
    <div className="space-y-6 lg:space-y-8 pb-12 transition-all overflow-x-hidden min-w-0">

      {/* =========================================================================
          1. HEADER / HERO WELCOME SECTION
          Distinguishes authenticated user workspace from public visitor landing
          Styled with Obsidian base, Emerald highlights, and metallic depth.
          ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 border shadow-lg transition-all backdrop-blur-xl theme-card"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {/* Decorative background glows */}
        <div
          className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: 'var(--accent-bright)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-w-0">
          {/* Left Column: Greeting & Value Proposition */}
          <div className="max-w-3xl min-w-0">
            {isAuthenticated ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-text)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-bright)' }} />
                    {formattedRoleName} Workspace
                  </span>
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                      System Administrator
                    </span>
                  )}
                </div>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display break-words"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Welcome in, <span style={{ color: 'var(--accent-bright)' }}>{displayName}</span>
                </h1>
                <p
                  className="text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isRecruiter && "Ready to screen resumes, manage candidate shortlists, and match talent to active requisitions."}
                  {isHiringManager && "Review shortlisted candidates, evaluate technical fits, and coordinate interview rounds."}
                  {isHrLead && "Monitor talent acquisition performance, evaluate pipeline throughput, and audit screening reports."}
                  {isAdmin && "Oversee system administration, candidate indexes, screening models, and user role permissions."}
                </p>
              </>
            ) : (
              <>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-3 shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent-text)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-bright)' }} />
                  <span>Next-Gen Recruitment Intelligence</span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display break-words"
                  style={{ color: 'var(--text-primary)' }}
                >
                  HireNova <span style={{ color: 'var(--accent-bright)' }}>Recruitment Platform</span>
                </h1>
                <p
                  className="text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Intelligent candidate ranking and automated resume screening powered by TF-IDF semantic similarity, Scikit-learn classification, and 60/40 weighted ATS precision.
                </p>
              </>
            )}

            {/* Architecture / Formula Status Pills */}
            <div
              className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t text-xs"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {/* Formula Pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <Target className="w-3.5 h-3.5" style={{ color: 'var(--accent-bright)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>ATS Formula:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>40% JD + 60% Skills</span>
              </div>

              {/* Threshold Pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-bright)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Shortlist:</span>
                <span className="font-bold" style={{ color: 'var(--accent-bright)' }}>Score &ge; 50%</span>
              </div>

              {/* ML Engine Status */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <span className={`w-2 h-2 rounded-full ${isSystemOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span style={{ color: 'var(--text-secondary)' }}>ML Engine:</span>
                <span className={`font-bold ${isSystemOnline ? 'text-emerald-500 dark:text-emerald-300' : 'text-amber-500 dark:text-amber-300'}`}>
                  {isSystemOnline ? 'Online' : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Role-Appropriate Primary CTAs (only for authenticated users) */}
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-0">
              {/* Recruiter / Admin: Start Screening CTA */}
              {(isRecruiter || isAdmin) && (
                <button
                  id="dashboard-cta-screen"
                  onClick={() => handleNavigate('screening')}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#FFFFFF'
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl hover:opacity-90 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Screening</span>
                </button>
              )}

              {/* Recruiter / Admin: Post Job */}
              {(isRecruiter || isAdmin) && (
                <button
                  id="dashboard-cta-jobs"
                  onClick={() => handleNavigate('jobs')}
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-sm border transition-all min-h-[42px]"
                >
                  <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                  <span>Manage Jobs</span>
                </button>
              )}

              {/* Hiring Manager CTAs */}
              {isHiringManager && (
                <>
                  <button
                    id="dashboard-cta-shortlist"
                    onClick={() => handleNavigate('shortlist')}
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: '#FFFFFF'
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl hover:opacity-90 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
                  >
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Review Shortlist</span>
                  </button>
                  <button
                    id="dashboard-cta-interviews"
                    onClick={() => handleNavigate('interviews')}
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-sm border transition-all min-h-[42px]"
                  >
                    <CalendarIcon className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                    <span>Interviews Pipeline</span>
                  </button>
                </>
              )}

              {/* HR Lead CTAs */}
              {isHrLead && (
                <>
                  <button
                    id="dashboard-cta-analytics"
                    onClick={() => handleNavigate('analytics')}
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: '#FFFFFF'
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl hover:opacity-90 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>View Analytics</span>
                  </button>
                  <button
                    id="dashboard-cta-reports"
                    onClick={() => handleNavigate('reports')}
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-sm border transition-all min-h-[42px]"
                  >
                    <FileSearch className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                    <span>Audit Reports</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. FOUR CORE RECRUITMENT KPI CARDS (RESPONSIVE GRID)
          Desktop: 4 columns | Tablet: 2 columns | Mobile: 2 columns
          Verified genuine database statistics only
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 min-w-0">
        
        {/* KPI 1: Total Candidates */}
        <div
          id="kpi-candidates-card"
          onClick={() => handleNavigate('rankings')}
          className="p-4 sm:p-5 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          title={isAuthenticated ? "View Candidate Rankings" : "Sign in to view candidates"}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Candidates
            </span>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-bright)'
              }}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              <AnimatedNumber value={totalCandidates} />
            </div>
            <div
              className="flex items-center justify-between text-[11px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Talent corpus indexed</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-bright)' }} />
            </div>
          </div>
        </div>

        {/* KPI 2: Active Openings */}
        <div
          id="kpi-jobs-card"
          onClick={() => handleNavigate('jobs')}
          className="p-4 sm:p-5 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          title={isAuthenticated ? "View Active Jobs" : "Sign in to view jobs"}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Active Jobs
            </span>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-bright)'
              }}
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              <AnimatedNumber value={activeJobsCount} />
            </div>
            <div
              className="flex items-center justify-between text-[11px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Open requisitions</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-bright)' }} />
            </div>
          </div>
        </div>

        {/* KPI 3: Resumes Screened */}
        <div
          id="kpi-screened-card"
          onClick={() => handleNavigate('screening')}
          className="p-4 sm:p-5 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          title={isAuthenticated ? "View Screening History" : "Sign in to view screenings"}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Resumes Screened
            </span>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-bright)'
              }}
            >
              <FileSearch className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              <AnimatedNumber value={screenedCount} />
            </div>
            <div
              className="flex items-center justify-between text-[11px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Evaluated by ATS</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-bright)' }} />
            </div>
          </div>
        </div>

        {/* KPI 4: Shortlisted Candidates */}
        <div
          id="kpi-shortlist-card"
          onClick={() => handleNavigate('shortlist')}
          className="p-4 sm:p-5 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          title={isAuthenticated ? "View Shortlist" : "Sign in to view shortlist"}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Shortlisted
            </span>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 bg-amber-500/10 border-amber-500/25 text-amber-500"
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 tabular-nums tracking-tight font-display">
              <AnimatedNumber value={shortlistedCount} />
            </div>
            <div
              className="flex items-center justify-between text-[11px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Score &ge; 50.0%</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. RECRUITMENT PIPELINE FUNNEL SECTION
          Visual progress: Applied -> Screened -> Shortlisted -> Interviewing
          ========================================================================= */}
      <div
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 theme-card"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h3
              className="font-extrabold text-sm sm:text-base flex items-center gap-2 font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
              Recruitment Pipeline Progress
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Live funnel stages tracked from initial corpus intake through ATS screening to interview rounds.
            </p>
          </div>
          <div
            className="text-xs font-semibold flex items-center gap-1.5 shrink-0"
            style={{ color: 'var(--accent-bright)' }}
          >
            <span>Overall Conversion:</span>
            <span className="font-bold">
              {totalCandidates > 0 ? `${((shortlistedCount / totalCandidates) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Funnel Stage Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4">
          {pipeline.map((stage, idx) => (
            <div
              key={stage.id}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#EAE7F4] dark:border-white/[0.06] ${stage.bgSubtle} flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${stage.textColor}`}>
                  Stage 0{idx + 1}
                </span>
                <span className="text-[10px] font-semibold text-[#736B92] dark:text-slate-400">
                  {stage.label}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-[#1C1739] dark:text-white tabular-nums font-display">
                  <AnimatedNumber value={stage.count} />
                </div>
                <div className="text-[10px] text-[#736B92] dark:text-slate-400 mt-0.5 truncate">
                  {stage.count === 0 ? 'No candidates yet' : `${stage.count} in this phase`}
                </div>
              </div>
              {/* Progress bar line */}
              <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-700`}
                  style={{
                    width: totalCandidates > 0 ? `${Math.min(100, Math.max(8, (stage.count / totalCandidates) * 100))}%` : '8%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          4. MAIN 2-COLUMN BALANCED ANALYTICS SECTION
          Col 1 (7 cols on lg): 7-Day Screening Activity Chart
          Col 2 (5 cols on lg): Compact ATS Matching Overview & Scoring Formula
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        
        {/* Left Column: 7-Day Screening Activity Chart */}
        <div
          className="lg:col-span-7 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 flex flex-col justify-between theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="min-w-0 pr-2">
                <h4
                  className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                  <span>Hiring & Screening Activity</span>
                </h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className="text-xl sm:text-2xl font-black tracking-tight font-display"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <AnimatedNumber value={screenedCount} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Total Evaluations Recorded
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleNavigate('analytics')}
                className="w-8 h-8 rounded-full bg-[#131F1B] hover:bg-[#182A24] text-[#34D399] flex items-center justify-center transition-colors shrink-0 border border-emerald-500/15"
                title="View Full Analytics"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* 7-Day Interactive Activity Bar Chart */}
            <div className="mt-4 pt-2">
              {weeklyData.every(d => d.count === 0) ? (
                <div className="py-10 text-center text-xs text-[#94A3A8]">
                  <p className="font-medium">No screening activity recorded in the past 7 days.</p>
                  <p className="text-[11px] text-[#94A3A8]/70 mt-1">
                    Upload candidate resumes against job descriptions to generate live trends.
                  </p>
                  <button
                    onClick={() => handleNavigate('screening')}
                    className="mt-3 text-[#34D399] font-bold text-xs hover:underline inline-flex items-center gap-1"
                  >
                    <span>+ Screen resumes to generate activity</span>
                  </button>
                </div>
              ) : (
                <div className="h-32 sm:h-40 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-3">
                  {weeklyData.map((bar, idx) => {
                    const maxVal = Math.max(...weeklyData.map(b => b.count), 1);
                    const heightPercent = bar.count > 0 ? Math.min(100, Math.max(18, (bar.count / maxVal) * 100)) : 8;
                    const isHovered = hoveredBarIndex === idx;

                    return (
                      <div
                        key={`${bar.day}-${idx}`}
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                        className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer relative"
                      >
                        {/* Tooltip on Hover or Peak */}
                        {(isHovered || (bar.isPeak && hoveredBarIndex === null)) && (
                          <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-[#059669] text-white text-[10px] font-bold shadow-md whitespace-nowrap z-20 animate-dropdown border border-emerald-400/30">
                            {bar.count} {bar.count === 1 ? 'Resume' : 'Resumes'}
                          </div>
                        )}

                        {/* Bar Pillar */}
                        <div className="w-full max-w-[24px] sm:max-w-[32px] h-24 sm:h-32 flex items-end justify-center rounded-full bg-[#131F1B] p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-full transition-all duration-300 ${
                              bar.count > 0
                                ? bar.isPeak || isHovered
                                  ? 'bg-gradient-to-t from-[#059669] to-[#34D399] shadow-sm shadow-emerald-500/30'
                                  : 'bg-[#059669] group-hover:bg-[#34D399]'
                                : 'bg-white/[0.06]'
                            }`}
                          />
                        </div>

                        {/* Day Label */}
                        <span className={`text-[10px] sm:text-[11px] font-bold transition-colors ${
                          bar.count > 0 ? 'text-[#F8FAFC]' : 'text-[#94A3A8]/70'
                        }`}>
                          {bar.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#94A3A8]">
            <span>Screening frequency: <strong className="text-[#F8FAFC]">Real-time DB query</strong></span>
            <button
              onClick={() => handleNavigate('screening')}
              className="text-[#34D399] font-bold hover:underline"
            >
              Evaluate New Batch &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Compact ATS Matching Overview & Scoring Formula */}
        <div
          className="lg:col-span-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 flex flex-col justify-between theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                <h4
                  className="font-extrabold text-xs sm:text-sm uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ATS Matching Overview
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/40 text-[#A7F3D0] border border-emerald-500/25">
                40/60 Model
              </span>
            </div>

            {/* Gauge & Formula Breakdown */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 mt-4 min-w-0">
              {/* Circular Gauge Ring with Genuine Average ATS Score */}
              <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#182A24"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#059669"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (Math.min(100, Math.max(0, avgAtsScore || 0)) / 100) * 251.2}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-display tabular-nums">
                    {avgAtsScore !== null ? `${avgAtsScore}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] font-bold text-[#94A3A8]">
                    Avg ATS Score
                  </span>
                </div>
              </div>

              {/* Exact Formula Explanation */}
              <div className="space-y-2.5 min-w-0 text-left w-full sm:w-auto">
                <div className="p-2.5 rounded-xl bg-[#131F1B]/70 border border-emerald-500/15">
                  <div className="text-[10px] font-bold text-[#94A3A8] uppercase tracking-wider">
                    Scoring Breakdown
                  </div>
                  <div className="text-xs font-black text-[#F8FAFC] mt-0.5">
                    40% JD Similarity + 60% Skills
                  </div>
                  <div className="text-[10px] text-[#94A3A8] mt-0.5">
                    TF-IDF cosine distance + required skill matches.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25">
                  <div className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider">
                    Shortlist Benchmark
                  </div>
                  <div className="text-xs font-bold text-[#A7F3D0] mt-0.5">
                    ATS Score &ge; 50.0%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() => handleNavigate('screening')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 min-h-[38px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isAuthenticated ? 'Screen New Batch' : 'Sign in to Start Screening'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          5. LOWER SECTION: UPCOMING INTERVIEWS & RECENT SCREENING ACTIVITY
          Genuine DB data only - NO fake interview candidates!
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        
        {/* Left Column (5 cols on lg): Upcoming Pipeline & Interviews */}
        <div
          className="lg:col-span-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 flex flex-col justify-between theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                <h4
                  className="font-extrabold text-xs sm:text-sm uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Upcoming Interviews
                </h4>
              </div>
              <button
                onClick={() => handleNavigate('interviews')}
                className="text-xs font-bold text-[#34D399] hover:underline shrink-0"
              >
                View all ({interviews.length}) &rarr;
              </button>
            </div>

            {/* Real Interview Events List */}
            <div className="mt-3 divide-y divide-white/[0.06]">
              {!isAuthenticated ? (
                /* Unauthenticated empty state */
                <div className="py-8 text-center text-xs text-[#94A3A8]">
                  <Lock className="w-7 h-7 mx-auto text-[#94A3A8]/60 mb-2" />
                  <p className="font-semibold text-[#F8FAFC]">
                    Candidate Interviews Protected
                  </p>
                  <p className="text-[11px] text-[#94A3A8] mt-1 max-w-xs mx-auto">
                    Sign in to view scheduled technical rounds, interviewer notes, and candidate pipeline dates.
                  </p>
                  <button
                    onClick={() => openAuthModal('login', '', 'interviews')}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-colors"
                  >
                    Sign In to View Schedule
                  </button>
                </div>
              ) : interviews.length === 0 ? (
                /* Genuine empty state: 0 interviews in database */
                <div className="py-8 text-center text-xs text-[#94A3A8]">
                  <CalendarIcon className="w-7 h-7 mx-auto text-[#94A3A8]/50 mb-2" />
                  <p className="font-semibold text-[#F8FAFC]">
                    No interviews scheduled yet.
                  </p>
                  <p className="text-[11px] text-[#94A3A8] mt-1 max-w-xs mx-auto">
                    Schedule technical rounds and manager reviews directly from shortlisted candidates.
                  </p>
                  {(isRecruiter || isHiringManager || isAdmin) && (
                    <button
                      onClick={() => handleNavigate('interviews')}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-950/40 text-[#34D399] border border-emerald-500/25 font-bold text-xs hover:bg-[#059669] hover:text-white transition-all"
                    >
                      + Schedule Interview
                    </button>
                  )}
                </div>
              ) : (
                /* Genuine interviews mapped from SQLite database */
                interviews.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNavigate('interviews')}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-[#131F1B]/60 px-2 rounded-xl transition-colors cursor-pointer min-w-0"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-bold text-[#34D399]">
                        {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date TBD'} • {item.stage}
                      </div>
                      <div className="text-xs font-bold text-[#F8FAFC] mt-0.5 truncate">
                        {item.candidate_name} ({item.job_title})
                      </div>
                      <div className="text-[10px] text-[#94A3A8] mt-0.5 truncate">
                        Interviewer: {item.interviewer}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/40 text-[#34D399] border border-emerald-500/20 shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Card Action */}
          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() => handleNavigate('interviews')}
              className="w-full py-2.5 rounded-xl bg-[#131F1B] hover:bg-[#182A24] text-[#34D399] border border-emerald-500/15 font-bold text-xs text-center transition-colors min-h-[38px] flex items-center justify-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Manage Candidate Pipeline</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols on lg): Recent Screening Activity */}
        <div
          className="lg:col-span-7 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 flex flex-col justify-between theme-card"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                <h4
                  className="font-extrabold text-xs sm:text-sm uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Recent Screening Activity
                </h4>
              </div>
              <button
                onClick={() => handleNavigate('shortlist')}
                className="text-xs font-bold text-[#34D399] hover:underline shrink-0"
              >
                View Shortlist &rarr;
              </button>
            </div>

            {/* List of Real Screenings */}
            <div className="mt-3 divide-y divide-white/[0.06]">
              {isAuthenticated ? (
                /* Authenticated user: View candidate screening details */
                recentScreenings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#94A3A8]">
                    <FileSearch className="w-7 h-7 mx-auto text-[#94A3A8]/50 mb-2" />
                    <p className="font-semibold text-[#F8FAFC]">
                      No screening activity recorded yet.
                    </p>
                    <p className="text-[11px] text-[#94A3A8] mt-1 max-w-xs mx-auto">
                      Upload resumes against job descriptions to begin candidate evaluation.
                    </p>
                    {(isRecruiter || isAdmin) && (
                      <button
                        onClick={() => handleNavigate('screening')}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-colors"
                      >
                        Screen First Resume
                      </button>
                    )}
                  </div>
                ) : (
                  recentScreenings.slice(0, 4).map((record) => (
                    <div
                      key={record.id}
                      onClick={() => {
                        if (setSelectedCandidateId) setSelectedCandidateId(record.candidate_id);
                        handleNavigate('result');
                      }}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-[#131F1B]/60 px-2 rounded-xl transition-colors cursor-pointer min-w-0"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#34D399] transition-colors truncate">
                          {record.candidate_name || `Candidate #${record.candidate_id}`}
                        </div>
                        <div className="text-[10px] text-[#94A3A8] truncate mt-0.5">
                          {record.job_title || 'General Role'} • {record.predicted_category || 'Engineering'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs text-[#34D399] tabular-nums px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/25">
                          {Math.round(record.ats_score || 0)}%
                        </span>
                        <RecommendationBadge recommendation={record.recommendation} />
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Unauthenticated visitors: Non-sensitive aggregate evaluations (No candidate PII) */
                (summaryData?.recent_public_activity && Array.isArray(summaryData.recent_public_activity) && summaryData.recent_public_activity.length > 0) ? (
                  summaryData.recent_public_activity.slice(0, 4).map((item) => (
                    <div
                      key={item?.id || Math.random()}
                      onClick={() => openAuthModal('login', '', 'rankings')}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-[#131F1B]/60 px-2 rounded-xl transition-colors cursor-pointer min-w-0"
                      title="Sign in to view candidate details"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#34D399] transition-colors truncate">
                          Candidate Evaluation #{item?.id}
                        </div>
                        <div className="text-[10px] text-[#94A3A8] truncate mt-0.5">
                          {item?.job_title || 'General Role'} • {item?.category || 'General'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs text-[#34D399] tabular-nums px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/25">
                          {Math.round(item?.ats_score || 0)}%
                        </span>
                        <RecommendationBadge recommendation={item?.recommendation} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-[#94A3A8]">
                    <p>No screening activity recorded yet.</p>
                    <p className="text-[11px] text-[#94A3A8]/70 mt-1">
                      Sign in to evaluate candidates against active job descriptions.
                    </p>
                    <button
                      onClick={() => openAuthModal('login', '', 'screening')}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-colors"
                    >
                      Sign In to Screen
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bottom Card Action */}
          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() => handleNavigate('rankings')}
              className="w-full py-2.5 rounded-xl bg-[#131F1B] hover:bg-[#182A24] text-[#34D399] border border-emerald-500/15 font-bold text-xs text-center transition-colors min-h-[38px] flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Explore Candidate Corpus</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          6. RECENT ACTIVE JOB OPENINGS (CONNECTED TO REAL DATABASE ENDPOINTS)
          Working "Screen Role" & "View All Jobs" links
          ========================================================================= */}
      <div
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xs min-w-0 theme-card"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
            <h3
              className="font-extrabold text-xs sm:text-base font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              Active Job Requisitions
            </h3>
          </div>
          <button
            onClick={() => handleNavigate('jobs')}
            className="text-xs font-bold text-[#34D399] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All ({activeJobsCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {jobs.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-[#94A3A8]">
              <Briefcase className="w-8 h-8 mx-auto text-[#94A3A8]/40 mb-2" />
              <p className="font-semibold text-[#F8FAFC]">
                {isAuthenticated ? "No job postings created yet." : "Sign in to view full job requisitions."}
              </p>
              <p className="text-[11px] text-[#94A3A8] mt-1 max-w-sm mx-auto">
                {isAuthenticated
                  ? "Create a job requisition with custom skills to begin candidate matching."
                  : "Authenticated recruiters can create, manage, and screen candidates against job descriptions."}
              </p>
              <button
                onClick={() => handleNavigate('jobs')}
                className="mt-3 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-colors"
              >
                {isAuthenticated ? "+ Create Job Description" : "Sign In to Access Jobs"}
              </button>
            </div>
          ) : (
            jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-[#131F1B]/70 border border-emerald-500/15 hover:border-[#34D399]/40 transition-all flex flex-col justify-between group min-w-0"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#34D399] transition-colors truncate">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/40 text-[#34D399] border border-emerald-500/20 shrink-0">
                      {job.status || 'Active'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#94A3A8] mt-1 truncate">
                    {job.department || 'Engineering'} • {job.required_skills?.length || 0} Required Skills
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3A8]">
                    ID: #{job.id}
                  </span>
                  <button
                    onClick={() => handleNavigate('screening', job)}
                    className="px-3 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold transition-all shadow-xs"
                  >
                    Screen Role
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
