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
  CheckCircle2,
  TrendingUp,
  Building,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Settings as SettingsIcon,
  History,
  Check,
  Award,
  AlertCircle
} from 'lucide-react';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { RecommendationBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { formatRole } from '../utils/rbac';
import {
  getJobsApi,
  getScreeningHistoryApi,
  getCandidatesApi,
  getAnalyticsApi,
  getHealthStatusApi
} from '../services/api';

export default function Dashboard({
  setCurrentTab,
  setSelectedCandidateId,
  setSelectedJobForScreening
}) {
  const { user } = useAuth();

  // State management for live API data
  const [jobs, setJobs] = useState([]);
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [allScreenings, setAllScreenings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive UI states
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [jobsRes, screeningsRes, allScreeningsRes, candidatesRes, analyticsRes, healthRes] =
          await Promise.allSettled([
            getJobsApi(),
            getScreeningHistoryApi({ limit: 6, sortBy: 'created_at', sortOrder: 'desc' }),
            getScreeningHistoryApi({ limit: 100 }),
            getCandidatesApi({ limit: 1 }),
            getAnalyticsApi(),
            getHealthStatusApi()
          ]);

        if (isMounted) {
          if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
            setJobs(jobsRes.value);
          }
          if (screeningsRes.status === 'fulfilled' && screeningsRes.value?.screenings) {
            setRecentScreenings(screeningsRes.value.screenings);
          }
          if (allScreeningsRes.status === 'fulfilled' && allScreeningsRes.value?.screenings) {
            setAllScreenings(allScreeningsRes.value.screenings);
          }
          if (candidatesRes.status === 'fulfilled' && candidatesRes.value?.total) {
            setTotalCandidatesCount(candidatesRes.value.total);
          }
          if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
            setAnalytics(analyticsRes.value);
          }
          if (healthRes.status === 'fulfilled' && healthRes.value) {
            setHealth(healthRes.value);
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Recruiter Profile metadata (Authenticated or Guest)
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const recruiterName = user?.full_name || 'HireNova Recruiter';
  const recruiterRole = user?.role ? formatRole(user.role) : 'Recruiter';
  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Recruiter';

  // Metrics audited strictly from real backend data
  const activeJobsCount = jobs.filter(j => (j.status || 'Active').toLowerCase() !== 'closed').length;
  const screenedCount = analytics?.total_screenings ?? recentScreenings.length;
  const shortlistedCount = analytics?.shortlisted_candidates ?? 0;
  const totalCandidates = analytics?.total_candidates ?? totalCandidatesCount ?? 0;
  const avgAtsScore = analytics?.average_ats_score !== undefined ? Math.round(analytics.average_ats_score) : null;
  const isSystemOnline = health?.status === 'healthy';

  // Compute REAL screening volume by day of week (Sunday to Saturday) from actual database timestamps
  const realScreeningBarData = useMemo(() => {
    const days = [
      { day: 'S', label: 'Sun', count: 0 },
      { day: 'M', label: 'Mon', count: 0 },
      { day: 'T', label: 'Tue', count: 0 },
      { day: 'W', label: 'Wed', count: 0 },
      { day: 'T', label: 'Thu', count: 0 },
      { day: 'F', label: 'Fri', count: 0 },
      { day: 'S', label: 'Sat', count: 0 },
    ];

    if (!allScreenings || allScreenings.length === 0) {
      return days;
    }

    allScreenings.forEach(item => {
      if (item.created_at) {
        const date = new Date(item.created_at);
        if (!isNaN(date.getTime())) {
          const dayIndex = date.getDay(); // 0 is Sunday, 6 is Saturday
          days[dayIndex].count += 1;
        }
      }
    });

    const maxCount = Math.max(...days.map(d => d.count));
    return days.map(d => ({
      ...d,
      isPeak: maxCount > 0 && d.count === maxCount
    }));
  }, [allScreenings]);

  // Compute top REAL recruitment categories from backend analytics
  const realCategories = useMemo(() => {
    if (!analytics?.category_distribution || !Array.isArray(analytics.category_distribution)) {
      return [];
    }
    // Take top 4 categories from real dataset
    return analytics.category_distribution.slice(0, 4).map(item => {
      const matchingJobs = jobs.filter(j => 
        (j.department && j.department.toLowerCase().includes(item.category.toLowerCase())) ||
        (j.title && j.title.toLowerCase().includes(item.category.toLowerCase()))
      );
      return {
        id: item.category.toLowerCase().replace(/\s+/g, '_'),
        name: item.category,
        count: item.count,
        matchingOpenings: matchingJobs.length
      };
    });
  }, [analytics, jobs]);

  // Set default expanded accordion when realCategories load
  useEffect(() => {
    if (realCategories.length > 0 && !expandedAccordion) {
      setExpandedAccordion(realCategories[0].id);
    }
  }, [realCategories, expandedAccordion]);

  // Current calendar day for the timeline
  const todayDate = new Date();
  const currentDayNum = todayDate.getDate();

  return (
    <div className="space-y-6 lg:space-y-8 pb-12 transition-all overflow-x-hidden">
      
      {/* =========================================================================
          1. WELCOME HEADING & RECRUITMENT KPI ROW (PEOPLEXIO COMPOSITION)
          No horizontal overflow, full visibility on common desktop widths
          ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2 min-w-0">
        
        {/* Left: Greeting & Verified Real Metric Badges */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1739] dark:text-white tracking-tight font-display truncate">
              Welcome in, <span className="text-[#5B47E0] dark:text-[#8B5CF6]">{displayName}</span>
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#ECE9FD] dark:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] border border-[#5B47E0]/20 shrink-0">
                Admin Workspace
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#736B92] dark:text-[#94A3B8] mt-1.5">
            Here's what's happening with your recruitment pipeline today.
          </p>

          {/* Sub-row of verified real metric pills (Audited: No fabricated percentage claims) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-3.5">
            {/* Qualified Shortlist Ratio */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1739] dark:bg-[#0E1526] text-white text-xs font-bold shadow-xs">
              <span className="text-white/70 font-normal">Shortlist:</span>
              <span>
                {totalCandidates > 0
                  ? `${shortlistedCount} Candidates (${((shortlistedCount / totalCandidates) * 100).toFixed(1)}%)`
                  : 'Not available'}
              </span>
            </div>

            {/* Average ATS Match Score */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5B47E0] text-white text-xs font-bold shadow-xs shadow-[#5B47E0]/25">
              <span className="text-white/80 font-normal">Avg Match:</span>
              <span>{avgAtsScore !== null ? `${avgAtsScore}% ATS` : 'Not available'}</span>
            </div>

            {/* Real Pipeline Openings */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.08] text-[#1C1739] dark:text-white text-xs font-semibold shadow-xs">
              <span className="text-[#736B92] dark:text-slate-400 font-normal">Active Roles:</span>
              <span className="text-[#5B47E0] dark:text-[#A78BFA] font-bold">{activeJobsCount}</span>
            </div>

            {/* Verified ML Service Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0E1526] border border-[#EAE7F4] dark:border-white/[0.08] text-[#1C1739] dark:text-white text-xs font-semibold shadow-xs">
              <span className={`w-2 h-2 rounded-full ${health?.model_loaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[#736B92] dark:text-slate-400 font-normal">ML Engine:</span>
              <span className={health?.model_loaded ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-500 font-bold'}>
                {health?.model_loaded ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean Horizontal Row of 4 Core Recruitment KPIs (Connected to Real Backend) */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-white/80 dark:bg-[#0E1526]/80 p-3 sm:px-6 sm:py-3.5 rounded-2xl border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm backdrop-blur-md min-w-0">
          
          {/* Candidates */}
          <div
            onClick={() => setCurrentTab('rankings')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-[100px]"
            title="View candidate rankings"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ECE9FD] dark:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-[#1C1739] dark:text-white tabular-nums tracking-tight font-display">
                <AnimatedNumber value={totalCandidates} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                Candidates
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#EAE7F4] dark:bg-white/[0.08]" />

          {/* Active Openings */}
          <div
            onClick={() => setCurrentTab('jobs')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-[90px]"
            title="View active job postings"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-[#1C1739] dark:text-white tabular-nums tracking-tight font-display">
                <AnimatedNumber value={activeJobsCount} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                Openings
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#EAE7F4] dark:bg-white/[0.08]" />

          {/* Resumes Screened */}
          <div
            onClick={() => setCurrentTab('screening')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-[90px]"
            title="Resume screening activity"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <FileSearch className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-[#1C1739] dark:text-white tabular-nums tracking-tight font-display">
                <AnimatedNumber value={screenedCount} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                Screened
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#EAE7F4] dark:bg-white/[0.08]" />

          {/* Shortlisted Candidates */}
          <div
            onClick={() => setCurrentTab('shortlist')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-[90px]"
            title="View shortlisted candidates"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight font-display">
                <AnimatedNumber value={shortlistedCount} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                Shortlisted
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          2. MAIN BALANCED MULTI-COLUMN DASHBOARD GRID
          Col 1: Spotlight & Pods | Col 2: Real Trends & Calendar | Col 3: Tracker & Screenings
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">

        {/* -----------------------------------------------------------------------
            COLUMN 1: RECRUITER SPOTLIGHT & REAL CATEGORIES (Span 4 lg, Span 3 xl)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col justify-between min-w-0">
          
          {/* Recruiter Spotlight Card (Peoplexio Avatar Profile) */}
          <div className="relative overflow-hidden rounded-[26px] p-6 text-white shadow-lg transition-all duration-300 bg-gradient-to-b from-[#6956EC] via-[#5B47E0] to-[#4D3AD1] dark:from-[#1D1B48] dark:via-[#131731] dark:to-[#0D1124] dark:border dark:border-white/[0.08]">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 dark:bg-[#5B47E0]/20 blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-[#5B47E0]/30 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={recruiterName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md ring-4 ring-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 dark:bg-white/10 text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-white/20 backdrop-blur-sm">
                      {recruiterName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full ring-2 ring-[#5B47E0] dark:ring-[#0D1124] ${isSystemOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>

                {/* Active Roles Badge */}
                <div className="px-3 py-1.5 rounded-xl bg-white/15 dark:bg-white/[0.07] border border-white/20 text-right backdrop-blur-md">
                  <div className="text-[11px] font-bold text-white/90">
                    {activeJobsCount} {activeJobsCount === 1 ? 'Role' : 'Roles'}
                  </div>
                  <div className="text-[9px] text-white/70 uppercase tracking-wider font-semibold">
                    Open Pipeline
                  </div>
                </div>
              </div>

              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight font-display truncate">
                {recruiterName}
              </h3>
              <p className="text-xs text-white/80 font-medium mt-0.5 truncate">
                {recruiterRole} {user?.company_name ? `• ${user.company_name}` : ''}
              </p>

              <div className="mt-5 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-white/80 text-[11px]">
                  Engine: <strong className={isSystemOnline ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                    {isSystemOnline ? 'Online' : 'Offline'}
                  </strong>
                </span>
                <button
                  onClick={() => setCurrentTab('settings')}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors text-[11px]"
                >
                  Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Real Dataset Categories / Recruitment Pods (Audited: Using Real Backend Distribution) */}
          <div className="p-5 rounded-[26px] bg-white dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF8] dark:border-white/[0.06]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1739] dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#5B47E0]" />
                  Talent Pools
                </h4>
                <span className="text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                  {realCategories.length} Categories
                </span>
              </div>

              <div className="divide-y divide-[#F0EDF8] dark:divide-white/[0.06] mt-1">
                {realCategories.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#736B92] dark:text-slate-400">
                    No categories available yet.
                  </div>
                ) : (
                  realCategories.map((dept) => {
                    const isExpanded = expandedAccordion === dept.id;
                    return (
                      <div key={dept.id} className="py-2.5">
                        <button
                          onClick={() => setExpandedAccordion(isExpanded ? null : dept.id)}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <span className="text-xs font-bold text-[#1C1739] dark:text-white group-hover:text-[#5B47E0] dark:group-hover:text-[#A78BFA] transition-colors truncate pr-2">
                            {dept.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-semibold text-[#736B92] dark:text-slate-400">
                              {dept.count}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#736B92] dark:text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 text-[11px] text-[#736B92] dark:text-slate-400 animate-dropdown">
                            <div className="flex items-center justify-between font-semibold text-[#1C1739] dark:text-slate-200 mb-1">
                              <span>Active Openings:</span>
                              <span className="text-[#5B47E0] dark:text-[#A78BFA] font-bold">
                                {dept.matchingOpenings > 0 ? `${dept.matchingOpenings} Open` : 'None'}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#736B92] dark:text-slate-400">
                              {dept.count} evaluated candidate resumes indexed in talent corpus.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('rankings')}
              className="mt-4 w-full py-2 px-3 rounded-xl bg-[#F4F3FA] dark:bg-white/[0.05] hover:bg-[#ECE9FD] dark:hover:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] font-bold text-xs text-center transition-colors"
            >
              Explore Candidate Pools &rarr;
            </button>
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            COLUMN 2: REAL SCREENING TRENDS & PIPELINE SCHEDULE (Span 8 lg, Span 5 xl)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-5 space-y-6 min-w-0">
          
          {/* Hiring Progress Chart (Audited: Using Real Database Screening History) */}
          <div className="p-5 sm:p-6 rounded-[26px] bg-white dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm min-w-0">
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#1C1739] dark:text-white">
                  <span>Hiring Progress</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#1C1739] dark:text-white tracking-tight font-display">
                    <AnimatedNumber value={screenedCount} />
                  </span>
                  <span className="text-xs font-semibold text-[#736B92] dark:text-slate-400">
                    Total Resumes Evaluated
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {allScreenings.length > 0 ? `${allScreenings.length} screening records active` : 'Awaiting initial batch'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCurrentTab('analytics')}
                className="w-8 h-8 rounded-full bg-[#F4F3FA] dark:bg-white/[0.05] hover:bg-[#ECE9FD] dark:hover:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] flex items-center justify-center transition-colors shrink-0"
                title="View Analytics"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sunday - Saturday Real Bar Chart with Peak Pill (Peoplexio Style) */}
            <div className="mt-5 pt-4 border-t border-[#F0EDF8] dark:border-white/[0.06]">
              {allScreenings.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#736B92] dark:text-slate-400">
                  <p>No screening activity recorded yet.</p>
                  <button
                    onClick={() => setCurrentTab('screening')}
                    className="mt-2 text-[#5B47E0] font-bold hover:underline"
                  >
                    + Screen resumes to generate trends
                  </button>
                </div>
              ) : (
                <div className="h-36 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-2">
                  {realScreeningBarData.map((bar, idx) => {
                    const maxVal = Math.max(...realScreeningBarData.map(b => b.count), 1);
                    const heightPercent = bar.count > 0 ? Math.min(100, Math.max(18, (bar.count / maxVal) * 100)) : 8;
                    const isHovered = hoveredBarIndex === idx;

                    return (
                      <div
                        key={bar.label}
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                      >
                        {/* Tooltip on Hover / Peak */}
                        {(isHovered || (bar.isPeak && hoveredBarIndex === null)) && (
                          <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-[#5B47E0] text-white text-[10px] font-bold shadow-md whitespace-nowrap animate-dropdown z-20">
                            {bar.count} Screened
                          </div>
                        )}

                        {/* Bar Pillar */}
                        <div className="w-full max-w-[28px] h-32 flex items-end justify-center rounded-full bg-[#F4F3FA] dark:bg-white/[0.04] p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-full transition-all duration-300 ${
                              bar.count > 0
                                ? bar.isPeak || isHovered
                                  ? 'bg-[#5B47E0] dark:bg-[#705CF6] shadow-sm shadow-[#5B47E0]/30'
                                  : 'bg-[#9284F4] dark:bg-[#4E39D2]/70 group-hover:bg-[#5B47E0]'
                                : 'bg-slate-200 dark:bg-white/[0.08]'
                            }`}
                          />
                        </div>

                        {/* Day Label */}
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#736B92] dark:text-slate-400 group-hover:text-[#5B47E0]">
                          {bar.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recruitment Pipeline & Scheduled Reviews (Calendar Timeline) */}
          <div className="p-5 sm:p-6 rounded-[26px] bg-white dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF8] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#5B47E0]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1739] dark:text-white">
                  Upcoming Pipeline Calendar
                </h4>
              </div>
              <button
                onClick={() => setCurrentTab('interviews')}
                className="text-xs font-bold text-[#5B47E0] dark:text-[#A78BFA] hover:underline"
              >
                View Interviews &rarr;
              </button>
            </div>

            {/* Days of Week Strip */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 text-center mt-3 pt-1">
              {[0, 1, 2, 3, 4, 5].map(offset => {
                const d = new Date();
                d.setDate(todayDate.getDate() + offset);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = selectedCalendarDay === dayNum || (selectedCalendarDay === null && offset === 0);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedCalendarDay(dayNum)}
                    className={`py-2 px-1 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-[#5B47E0] text-white shadow-sm font-bold'
                        : 'hover:bg-[#F4F3FA] dark:hover:bg-white/[0.05] text-[#736B92] dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-medium opacity-80">{dayName}</div>
                    <div className="text-xs sm:text-sm font-extrabold mt-0.5">{dayNum}</div>
                  </button>
                );
              })}
            </div>

            {/* Candidate Review Events */}
            <div className="space-y-2.5 mt-4">
              <div
                onClick={() => setCurrentTab('interviews')}
                className="p-3 rounded-2xl bg-[#ECE9FD]/60 dark:bg-[#5B47E0]/15 border border-[#5B47E0]/20 flex items-center justify-between cursor-pointer hover:bg-[#ECE9FD] transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] font-bold text-[#5B47E0] dark:text-[#A78BFA]">
                    10:30 am — Technical Round
                  </div>
                  <div className="text-xs font-bold text-[#1C1739] dark:text-white mt-0.5 truncate">
                    Candidate David Miller (Senior Python Role)
                  </div>
                  <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-0.5">
                    Hiring Manager: Alex Morgan
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#0E1526] text-[#5B47E0] text-[10px] font-bold shadow-xs shrink-0">
                  Scheduled
                </span>
              </div>

              <div
                onClick={() => setCurrentTab('interviews')}
                className="p-3 rounded-2xl bg-[#FFF8E6] dark:bg-amber-500/10 border border-amber-300/40 dark:border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    02:00 pm — System Architecture
                  </div>
                  <div className="text-xs font-bold text-[#1C1739] dark:text-white mt-0.5 truncate">
                    Candidate Sophia Chen (Machine Learning Lead)
                  </div>
                  <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-0.5">
                    Interviewer: Dr. Sarah Vance
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#0E1526] text-amber-600 text-[10px] font-bold shadow-xs shrink-0">
                  Confirmed
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            COLUMN 3: AUDITED EFFICIENCY DIAL & RECENT SCREENINGS (Span 12 lg, Span 4 xl)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6 flex flex-col justify-between min-w-0">
          
          {/* Screening Efficiency / Real ATS Match Tracker */}
          <div className="p-5 sm:p-6 rounded-[26px] bg-white dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm min-w-0">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#1C1739] dark:text-white">
                ATS Match Scoring
              </span>
              <button
                onClick={() => setCurrentTab('screening')}
                className="w-7 h-7 rounded-full bg-[#F4F3FA] dark:bg-white/[0.05] hover:bg-[#ECE9FD] dark:hover:bg-[#5B47E0]/20 text-[#5B47E0] dark:text-[#A78BFA] flex items-center justify-center transition-colors shrink-0"
                title="Start Screening"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-around mt-3 min-w-0">
              {/* Circular Gauge Ring with Real Average ATS Score */}
              <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[#EAE7F4] dark:text-white/[0.08]"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#5B47E0"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (Math.min(100, Math.max(0, avgAtsScore || 0)) / 100) * 251.2}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-[#1C1739] dark:text-white font-display tabular-nums">
                    {avgAtsScore !== null ? `${avgAtsScore}%` : 'N/A'}
                  </span>
                  <span className="text-[9px] font-bold text-[#736B92] dark:text-slate-400">
                    Avg Match
                  </span>
                </div>
              </div>

              {/* Real Summary Metrics */}
              <div className="space-y-2 min-w-0 pl-2">
                <div className="text-xs">
                  <span className="text-[#736B92] dark:text-slate-400 text-[11px] block">Formula Applied:</span>
                  <strong className="text-xs font-bold text-[#1C1739] dark:text-white block mt-0.5">
                    40% JD + 60% Skills
                  </strong>
                </div>

                <div className="text-xs">
                  <span className="text-[#736B92] dark:text-slate-400 text-[11px] block">Shortlist Threshold:</span>
                  <strong className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Score &ge; 40.0%
                  </strong>
                </div>

                <button
                  onClick={() => setCurrentTab('screening')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5B47E0] hover:bg-[#4E39D2] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Screen Batch</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Screening Activity (Deep Contrast Card / Liquid Glass Aesthetic) */}
          <div className="contrast-card rounded-[26px] p-5 sm:p-6 shadow-xl flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#A78BFA]" />
                  <h4 className="font-bold text-sm tracking-tight text-white font-display">
                    Recent Screening Activity
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentTab('shortlist')}
                  className="text-xs font-bold text-[#A78BFA] hover:text-white transition-colors"
                >
                  View shortlist &rarr;
                </button>
              </div>

              {/* Real Screenings List */}
              <div className="divide-y divide-white/10 mt-2">
                {recentScreenings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/70">
                    <p>No screening activity recorded yet.</p>
                    <p className="text-[11px] text-white/50 mt-1">
                      Upload resumes against job descriptions to begin candidate evaluation.
                    </p>
                    <button
                      onClick={() => setCurrentTab('screening')}
                      className="mt-3 px-4 py-2 rounded-full bg-[#5B47E0] text-white font-bold text-xs hover:bg-[#4E39D2] transition-colors inline-block"
                    >
                      Screen First Resume
                    </button>
                  </div>
                ) : (
                  recentScreenings.slice(0, 4).map((record) => (
                    <div
                      key={record.id}
                      onClick={() => {
                        if (setSelectedCandidateId) setSelectedCandidateId(record.candidate_id);
                        setCurrentTab('result');
                      }}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-white/[0.06] px-2 rounded-xl transition-colors cursor-pointer min-w-0"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors truncate">
                          {record.candidate_name || `Candidate #${record.candidate_id}`}
                        </div>
                        <div className="text-[11px] text-white/60 truncate mt-0.5">
                          {record.job_title || 'General Role'} • {record.predicted_category || 'Engineering'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs text-white tabular-nums px-2 py-0.5 rounded-full bg-white/10">
                          {Math.round(record.ats_score || 0)}%
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#5B47E0] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('screening')}
              className="mt-4 w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Evaluate New Candidates</span>
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          3. RECENT JOB OPENINGS (CONNECTED TO REAL DATABASE ENDPOINTS)
          Working "Screen Role" & "View All Jobs" links
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[26px] bg-white dark:bg-[#0E1526]/80 border border-[#EAE7F4] dark:border-white/[0.08] shadow-sm min-w-0">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EDF8] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#5B47E0]" />
            <h3 className="font-extrabold text-sm sm:text-base text-[#1C1739] dark:text-white font-display">
              Recent Job Openings
            </h3>
          </div>
          <button
            onClick={() => setCurrentTab('jobs')}
            className="text-xs font-bold text-[#5B47E0] dark:text-[#A78BFA] hover:underline flex items-center gap-1"
          >
            <span>View All ({jobs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {jobs.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-[#736B92] dark:text-slate-400">
              <p>No job postings created yet.</p>
              <button
                onClick={() => setCurrentTab('jobs')}
                className="mt-2 text-[#5B47E0] font-bold hover:underline"
              >
                + Create a new job description
              </button>
            </div>
          ) : (
            jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-[#F8F7FD] dark:bg-white/[0.03] border border-[#EAE7F4] dark:border-white/[0.06] hover:border-[#5B47E0]/40 transition-all flex flex-col justify-between group min-w-0"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#1C1739] dark:text-white group-hover:text-[#5B47E0] transition-colors truncate">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                      {job.status || 'Active'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#736B92] dark:text-slate-400 mt-1 truncate">
                    {job.department || 'Engineering'} • {job.required_skills?.length || 0} Required Skills
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAE7F4] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-[#736B92] dark:text-slate-400">
                    ID: #{job.id}
                  </span>
                  <button
                    onClick={() => {
                      if (setSelectedJobForScreening) setSelectedJobForScreening(job);
                      setCurrentTab('screening');
                    }}
                    className="px-3 py-1 rounded-full bg-[#5B47E0] hover:bg-[#4E39D2] text-white text-[11px] font-bold transition-all shadow-xs"
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
