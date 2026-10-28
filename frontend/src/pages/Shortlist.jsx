import React, { useState, useEffect } from 'react';
import { Star, Download, Search, FileText, ArrowRight, Eye, UserCheck } from 'lucide-react';
import { RecommendationBadge } from '../components/common/Badge';
import ResumeViewerModal from '../components/common/ResumeViewerModal';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { fetchCandidatesApi } from '../services/screeningService';
import { getExportShortlistUrl, getCandidateResumeDownloadUrl, downloadCandidateResumeFile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Shortlist({ onSelectCandidate, setCurrentTab }) {
  const { openAuthModal } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeResumeViewer, setActiveResumeViewer] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadShortlist() {
      setIsLoading(true);
      try {
        const res = await fetchCandidatesApi({ limit: 50 });
        if (isMounted && res && res.candidates) {
          // Filter candidates with ATS score >= 50% or Strong/Good match
          const shortlisted = res.candidates.filter(
            c => (c.ats_score || c.atsScore || 0) >= 30
          );
          setCandidates(shortlisted);
        }
      } catch (err) {
        console.warn('Shortlist fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadShortlist();
    return () => { isMounted = false; };
  }, []);

  const filtered = candidates.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const category = (c.category || '').toLowerCase();
    const skills = (c.matched_skills || []).join(' ').toLowerCase();
    return name.includes(term) || category.includes(term) || skills.includes(term);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Shortlisted Candidates
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              {candidates.length} Qualified
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top candidates who met or exceeded role match thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getExportShortlistUrl()}
            download
            className="btn-interactive inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#121A2F] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export Shortlist CSV</span>
          </a>

          <button
            onClick={() => setCurrentTab('screening')}
            className="btn-interactive inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            <span>Screen More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, role, skill..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading shortlist...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">No Shortlisted Candidates Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Screen resumes to identify and shortlist qualified candidates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-medium w-14">Rank</th>
                  <th className="py-3 px-4 font-medium">Candidate</th>
                  <th className="py-3 px-4 font-medium">Domain / Role</th>
                  <th className="py-3 px-4 font-medium">Match Score</th>
                  <th className="py-3 px-4 font-medium">Matched Skills</th>
                  <th className="py-3 px-4 font-medium">Recommendation</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((c, idx) => {
                  const score = Math.round(c.ats_score || c.atsScore || 0);
                  const matched = c.matched_skills || [];
                  const name = c.name || `Candidate ${c.id}`;

                  return (
                    <tr
                      key={c.id || idx}
                      style={{ '--row-index': idx }}
                      className="animate-row-enter hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        #{c.rank || idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectCandidate(c.id)}
                          className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors"
                        >
                          {name}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {c.id}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {c.category || 'Engineering'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold tabular-nums ${score >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            <AnimatedNumber value={score} duration={350} />%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${score >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {matched.slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {matched.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{matched.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <RecommendationBadge recommendation={c.recommendation} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setActiveResumeViewer({
                              id: c.id,
                              name,
                              fileName: `Resume_${c.id}.pdf`,
                              text: c.resume_preview || ''
                            })}
                            className="btn-interactive p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="View Resume"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await downloadCandidateResumeFile(c.id, `Resume_${c.id}.pdf`);
                              } catch (err) {
                                if (err.isAuthError || err.status === 401) {
                                  if (openAuthModal) openAuthModal('login');
                                } else {
                                  alert(err.message || 'Failed to download resume file.');
                                }
                              }
                            }}
                            className="btn-interactive p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Download Resume"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectCandidate(c.id)}
                            className="btn-interactive px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resume Viewer Modal */}
      {activeResumeViewer && (
        <ResumeViewerModal
          candidateId={activeResumeViewer.id}
          candidateName={activeResumeViewer.name}
          fileName={activeResumeViewer.fileName}
          resumeText={activeResumeViewer.text}
          isOpen={true}
          onClose={() => setActiveResumeViewer(null)}
        />
      )}
    </div>
  );
}
