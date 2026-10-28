import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Star,
  FileText,
  UserCheck,
  CheckCircle2,
  SlidersHorizontal,
  Briefcase
} from 'lucide-react';
import { RecommendationBadge } from '../components/common/Badge';
import AnimatedNumber from '../components/common/AnimatedNumber';
import ResumeViewerModal from '../components/common/ResumeViewerModal';
import { getAllCandidates, fetchCandidatesApi } from '../services/screeningService';
import { getExportRankingsUrl, getExportShortlistUrl, getCandidateResumeDownloadUrl } from '../services/api';

export default function CandidateRankings({ onSelectCandidate }) {
  const [candidates, setCandidates] = useState(() => getAllCandidates());
  const [isLoading, setIsLoading] = useState(false);
  const [activeResumeCandidate, setActiveResumeCandidate] = useState(null);

  // Shortlist tracking state (persisted in localStorage)
  const [shortlistIds, setShortlistIds] = useState(() => {
    try {
      const stored = localStorage.getItem('hirenova_shortlist_ids') || localStorage.getItem('recruitx_shortlist_ids') || localStorage.getItem('shortlisted_candidates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleShortlist = (e, candidateId) => {
    e.stopPropagation();
    setShortlistIds(prev => {
      const exists = prev.includes(candidateId);
      const updated = exists ? prev.filter(id => id !== candidateId) : [...prev, candidateId];
      try {
        localStorage.setItem('hirenova_shortlist_ids', JSON.stringify(updated));
        localStorage.setItem('shortlisted_candidates', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save shortlist:', err);
      }
      return updated;
    });
  };

  useEffect(() => {
    let isMounted = true;
    async function loadCandidates() {
      setIsLoading(true);
      try {
        const res = await fetchCandidatesApi({ limit: 100 });
        if (isMounted && res.candidates && res.candidates.length > 0) {
          setCandidates(res.candidates);
        }
      } catch (e) {
        console.warn('Backend candidates fetch error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCandidates();
    return () => { isMounted = false; };
  }, []);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('ALL');
  const [selectedScore, setSelectedScore] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState('rank'); // 'rank' | 'atsScore' | 'name'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Distinct jobs / categories list for filter
  const jobOptions = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      const job = c.jobTitle || (c.category === 'ENGINEERING' ? 'Python Developer' : c.category === 'INFORMATION-TECHNOLOGY' ? 'Software Engineer' : c.category);
      if (job) set.add(job);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [candidates]);

  // Filter & sort candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        const candidateId = candidate.id || candidate.candidate_id;
        const term = searchTerm.toLowerCase().trim();
        const score = candidate.atsScore !== undefined ? candidate.atsScore : candidate.ats_score || 0;
        const jobName = candidate.jobTitle || (candidate.category === 'ENGINEERING' ? 'Python Developer' : candidate.category === 'INFORMATION-TECHNOLOGY' ? 'Software Engineer' : candidate.category || '');
        const recommendation = candidate.recommendation || '';
        const isShortlisted = shortlistIds.includes(candidateId);

        // Search match
        const matchesSearch =
          !term ||
          (candidate.name && candidate.name.toLowerCase().includes(term)) ||
          String(candidateId).toLowerCase().includes(term) ||
          jobName.toLowerCase().includes(term) ||
          (candidate.matchedSkills && candidate.matchedSkills.some(s => s.toLowerCase().includes(term))) ||
          (candidate.matched_skills && candidate.matched_skills.some(s => s.toLowerCase().includes(term)));

        // Job filter
        const matchesJob = selectedJob === 'ALL' || jobName === selectedJob;

        // Score filter
        let matchesScore = true;
        if (selectedScore === '80+') matchesScore = score >= 80;
        else if (selectedScore === '60+') matchesScore = score >= 60;
        else if (selectedScore === '40+') matchesScore = score >= 40;

        // Status filter
        let matchesStatus = true;
        if (selectedStatus === 'Shortlisted') {
          matchesStatus = isShortlisted;
        } else if (selectedStatus !== 'ALL') {
          matchesStatus = recommendation.toLowerCase().includes(selectedStatus.toLowerCase());
        }

        return matchesSearch && matchesJob && matchesScore && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'atsScore') {
          valA = a.atsScore !== undefined ? a.atsScore : a.ats_score || 0;
          valB = b.atsScore !== undefined ? b.atsScore : b.ats_score || 0;
        } else if (sortField === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [candidates, searchTerm, selectedJob, selectedScore, selectedStatus, shortlistIds, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredCandidates.length / rowsPerPage) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCandidates.slice(start, start + rowsPerPage);
  }, [filteredCandidates, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedJob('ALL');
    setSelectedScore('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Candidates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and review candidate profiles, match scores, and verified skills.
          </p>
        </div>

        {/* Server CSV Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getExportRankingsUrl()}
            download="Candidate_Rankings.csv"
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0E1424] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            title="Download full candidate rankings CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </a>

          <a
            href={getExportShortlistUrl()}
            download="Shortlisted_Candidates.csv"
            className="px-3.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            title="Download top shortlisted candidates CSV"
          >
            <Star className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export Shortlist</span>
          </a>
        </div>
      </div>

      {/* Simple Filter Controls Bar */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search candidates by name, job, or skill..."
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Job Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Job:</span>
            <select
              value={selectedJob}
              onChange={(e) => {
                setSelectedJob(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[160px] truncate"
            >
              {jobOptions.map(job => (
                <option key={job} value={job}>{job === 'ALL' ? 'All Jobs' : job}</option>
              ))}
            </select>
          </div>

          {/* Score Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Score:</span>
            <select
              value={selectedScore}
              onChange={(e) => {
                setSelectedScore(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Scores</option>
              <option value="80+">80% and above</option>
              <option value="60+">60% and above</option>
              <option value="40+">40% and above</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Strong">Strong Match</option>
              <option value="Good">Good Match</option>
              <option value="Moderate">Moderate Match</option>
            </select>
          </div>

          {(searchTerm || selectedJob !== 'ALL' || selectedScore !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080B14]/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-5 cursor-pointer hover:text-slate-800 dark:hover:text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    Candidate
                    {sortField === 'name' && <ArrowUpDown className="w-3 h-3 text-indigo-500" />}
                  </span>
                </th>
                <th className="py-3 px-5">Applied For</th>
                <th
                  onClick={() => handleSort('atsScore')}
                  className="py-3 px-5 w-28 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    Match Score
                    {sortField === 'atsScore' && <ArrowUpDown className="w-3 h-3 text-indigo-500" />}
                  </span>
                </th>
                <th className="py-3 px-5 w-32">Status</th>
                <th className="py-3 px-5">Top Skills</th>
                <th className="py-3 px-5 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedCandidates.length > 0 ? (
                paginatedCandidates.map((c, idx) => {
                  const candidateId = c.id || c.candidate_id;
                  const candidateName = c.name || `Candidate #${candidateId}`;
                  const category = c.category || 'TECHNICAL';
                  const roleName = c.jobTitle || (category === 'ENGINEERING' ? 'Python Developer' : category === 'INFORMATION-TECHNOLOGY' ? 'Software Engineer' : category);
                  const atsScore = Math.round(c.atsScore !== undefined ? c.atsScore : c.ats_score || 0);
                  const matchedSkills = c.matchedSkills || c.matched_skills || [];
                  const recommendation = c.recommendation || 'Evaluated';
                  const isShortlisted = shortlistIds.includes(candidateId);

                  // Score styling
                  let scoreBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (atsScore >= 75) {
                    scoreBadgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60';
                  } else if (atsScore >= 50) {
                    scoreBadgeClass = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60';
                  } else if (atsScore >= 30) {
                    scoreBadgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60';
                  }

                  const initials = candidateName
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={candidateId}
                      style={{ '--row-index': idx }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-colors group animate-row-enter"
                    >
                      {/* CANDIDATE */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-semibold text-xs shrink-0 transition-transform duration-150 group-hover:scale-105">
                            {initials}
                          </div>
                          <div>
                            <button
                              onClick={() => onSelectCandidate(candidateId)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                            >
                              {candidateName}
                            </button>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: #{candidateId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* APPLIED FOR */}
                      <td className="py-3.5 px-5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
                          {roleName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {category}
                        </div>
                      </td>

                      {/* MATCH SCORE */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md font-semibold text-xs tabular-nums ${scoreBadgeClass}`}>
                          <AnimatedNumber value={atsScore} suffix="%" />
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-1 items-start">
                          {isShortlisted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              Shortlisted
                            </span>
                          )}
                          <RecommendationBadge recommendation={recommendation} size="xs" />
                        </div>
                      </td>

                      {/* TOP SKILLS */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {matchedSkills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="inline-block px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                          {matchedSkills.length > 3 && (
                            <span className="inline-block px-1.5 py-0.5 text-[11px] rounded text-slate-400 bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800">
                              +{matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS: View, Shortlist, Resume */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => onSelectCandidate(candidateId)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#080B14] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm btn-interactive"
                            title="View Full Profile"
                          >
                            <Eye className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>View</span>
                          </button>

                          {/* Shortlist Toggle */}
                          <button
                            onClick={(e) => toggleShortlist(e, candidateId)}
                            className={`p-1.5 rounded-md border text-xs btn-interactive ${
                              isShortlisted
                                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                                : 'bg-white dark:bg-[#080B14] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                            }`}
                            title={isShortlisted ? 'Remove from Shortlist' : 'Shortlist Candidate'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>

                          {/* Resume Modal Launcher */}
                          <button
                            onClick={() => setActiveResumeCandidate({
                              id: candidateId,
                              name: candidateName,
                              jobTitle: roleName
                            })}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-md btn-interactive"
                            title="View Candidate Resume"
                          >
                            <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Resume</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No candidates match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#080B14]/70">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-white">{filteredCandidates.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-white">{Math.min(filteredCandidates.length, currentPage * rowsPerPage)}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-white">{filteredCandidates.length}</span> candidates
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Resume Viewer Modal */}
      {activeResumeCandidate && (
        <ResumeViewerModal
          candidateId={activeResumeCandidate.id}
          candidateName={activeResumeCandidate.name}
          jobTitle={activeResumeCandidate.jobTitle}
          onClose={() => setActiveResumeCandidate(null)}
        />
      )}
    </div>
  );
}
