import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  FileCheck,
  Star,
  Percent,
  TrendingUp,
  BarChart2,
  ArrowRight
} from 'lucide-react';
import { getSystemStats, fetchAnalyticsApi } from '../services/screeningService';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { getJobsApi } from '../services/api';

export default function Analytics({ setCurrentTab }) {
  const [stats, setStats] = useState(() => getSystemStats());
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [liveAnalytics, jobsRes] = await Promise.allSettled([
          fetchAnalyticsApi(),
          getJobsApi()
        ]);

        if (isMounted) {
          if (liveAnalytics.status === 'fulfilled' && liveAnalytics.value) {
            const data = liveAnalytics.value;
            setStats(prev => ({
              ...prev,
              totalResumes: data.total_resumes || prev.totalResumes,
              totalCandidates: data.total_candidates || prev.totalCandidates,
              shortlistedCandidates: data.shortlisted_candidates || prev.shortlistedCandidates,
              totalScreenings: data.total_screenings !== undefined ? data.total_screenings : prev.totalScreenings,
              averageAtsScore: data.average_ats_score || prev.averageAtsScore,
              categoryDistribution: data.category_distribution || prev.categoryDistribution,
              scoreDistribution: data.score_distribution || prev.scoreDistribution,
              skillDistribution: data.skill_distribution || prev.skillDistribution,
            }));
          }

          if (jobsRes.status === 'fulfilled' && jobsRes.value && Array.isArray(jobsRes.value.jobs)) {
            setTotalJobs(jobsRes.value.jobs.length);
          }
        }
      } catch (err) {
        console.warn('Analytics loading error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const totalCandidates = stats.totalCandidates || 0;
  const screenedCount = stats.totalScreenings !== undefined ? stats.totalScreenings : (stats.totalResumes || 0);
  const shortlistedCount = stats.shortlistedCandidates || 0;
  const avgMatchScore = Math.round(stats.averageAtsScore || 0);
  const categories = stats.categoryDistribution || [];
  const scoreBuckets = stats.scoreDistribution || [];

  const hasData = totalCandidates > 0 || screenedCount > 0 || totalJobs > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time recruitment metrics, screening volumes, and match insights.
          </p>
        </div>
      </div>

      {/* 5 Useful Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Jobs */}
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Jobs</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            <AnimatedNumber value={totalJobs} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active postings</div>
        </div>

        {/* Total Candidates */}
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Candidates</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            <AnimatedNumber value={totalCandidates} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">In recruitment pool</div>
        </div>

        {/* Screened */}
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Screened</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            <AnimatedNumber value={screenedCount} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Evaluated resumes</div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Shortlisted</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            <AnimatedNumber value={shortlistedCount} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Met match criteria</div>
        </div>

        {/* Average Match Score */}
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1 card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Match Score</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            <AnimatedNumber value={avgMatchScore} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all screenings</div>
        </div>
      </div>

      {/* Charts Section: Display only when actual data exists */}
      {!hasData ? (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No analytics available yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Create a job opening and screen resumes to generate candidate rankings and analytics.
          </p>
          {setCurrentTab && (
            <button
              onClick={() => setCurrentTab('screening')}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Screen Resumes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Candidate Distribution by Domain */}
          <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Candidates by Domain
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution across top job functional categories
              </p>
            </div>

            <div className="space-y-3">
              {categories.slice(0, 6).map((cat, idx) => {
                const maxCount = Math.max(...categories.slice(0, 6).map(c => c.count || 1));
                const pct = Math.round(((cat.count || 0) / maxCount) * 100);
                return (
                  <div key={cat.category || idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[240px]">
                        {cat.category}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {cat.count} candidates
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Score Distribution */}
          <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Match Score Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Candidate volume grouped by ATS match threshold
              </p>
            </div>

            {scoreBuckets.length > 0 ? (
              <div className="space-y-3">
                {scoreBuckets.map((bucket, idx) => {
                  const maxB = Math.max(...scoreBuckets.map(b => b.count || 1));
                  const pct = Math.round(((bucket.count || 0) / maxB) * 100);
                  return (
                    <div key={bucket.range || idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {bucket.range} Score
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                          {bucket.count} candidates ({Math.round(((bucket.count || 0) / (totalCandidates || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No score distribution data available yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
