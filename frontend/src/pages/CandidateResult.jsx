import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Star,
  CheckCircle2,
  FileText,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Cpu,
  Share2,
  BookmarkCheck
} from 'lucide-react';
import { RecommendationBadge } from '../components/common/Badge';
import AnimatedNumber from '../components/common/AnimatedNumber';
import ResumeViewerModal from '../components/common/ResumeViewerModal';
import { fetchCandidateByIdApi, getCandidateById, getAllCandidates } from '../services/screeningService';
import { getCandidateResumeDownloadUrl, downloadCandidateResumeFile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CandidateResult({ candidateId, analysisResult, setCurrentTab }) {
  const { openAuthModal } = useAuth();
  const [candidate, setCandidate] = useState(analysisResult || null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isUnderReview, setIsUnderReview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);

  useEffect(() => {
    if (analysisResult) {
      setCandidate(analysisResult);
      return;
    }

    if (candidateId) {
      setIsLoading(true);
      let isMounted = true;
      async function loadCandidate() {
        try {
          const res = await fetchCandidateByIdApi(candidateId);
          if (isMounted && res) {
            setCandidate(res);
          }
        } catch (e) {
          console.warn('Candidate API load error:', e);
          const fallback = getCandidateById(candidateId);
          if (isMounted) setCandidate(fallback);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
      loadCandidate();
      return () => { isMounted = false; };
    } else if (!candidate) {
      const all = getAllCandidates();
      setCandidate(all[0] || null);
    }
  }, [candidateId, analysisResult]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        Loading candidate profile...
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white dark:bg-[#0E1424] rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">No Candidate Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please screen a resume or select a candidate from Rankings.</p>
        <button
          onClick={() => setCurrentTab('screening')}
          className="mt-4 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Screen Resume Now
        </button>
      </div>
    );
  }

  const atsScore = Math.round(candidate.atsScore !== undefined ? candidate.atsScore : candidate.ats_score || 82);
  const similarityScore = Math.round(candidate.similarity !== undefined ? candidate.similarity : candidate.similarity_score || 68);
  const skillScore = Math.round(candidate.skillScore !== undefined ? candidate.skillScore : candidate.skill_score || 85);
  const matchedSkills = candidate.matchedSkills || candidate.matched_skills || ['python', 'sql', 'git', 'django', 'data structures'];
  const missingSkills = candidate.missingSkills || candidate.missing_skills || ['rest api', 'docker'];
  const category = candidate.category || 'ENGINEERING';
  const roleTitle = candidate.jobTitle || candidate.job_title || 'Python Developer';
  const cName = candidate.name || `Candidate #${candidate.id}`;
  const cId = candidate.id || 'CAND-101';
  const fileName = candidate.fileName || candidate.resume_filename || `Resume_${cId}.pdf`;

  const downloadUrl = getCandidateResumeDownloadUrl(cId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Profile Header (Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('rankings')}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to candidates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {cName}
              </h1>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {roleTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 tabular-nums">
                <AnimatedNumber value={atsScore} suffix="% Match" />
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {cId} • {fileName}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons (Requirement 9) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Resume Button (Opens Modal Viewer) */}
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#121A2F] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm btn-interactive"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>View Resume</span>
          </button>

          {/* Download Resume Button (Real File with JWT Auth) */}
          <button
            type="button"
            disabled={isDownloadingResume}
            onClick={async () => {
              try {
                setIsDownloadingResume(true);
                await downloadCandidateResumeFile(cId, fileName);
              } catch (err) {
                if (err.isAuthError || err.status === 401) {
                  if (openAuthModal) openAuthModal('login');
                } else {
                  alert(err.message || 'Failed to download resume file.');
                }
              } finally {
                setIsDownloadingResume(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-emerald-200 bg-white dark:bg-[#131F1B] hover:bg-slate-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-emerald-500/30 rounded-lg shadow-sm btn-interactive disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{isDownloadingResume ? 'Downloading...' : 'Download Resume'}</span>
          </button>

          {/* Shortlist Toggle */}
          <button
            onClick={() => setIsShortlisted(!isShortlisted)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm btn-interactive ${
              isShortlisted
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
          </button>

          {/* Mark for Review Toggle */}
          <button
            onClick={() => setIsUnderReview(!isUnderReview)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm btn-interactive ${
              isUnderReview
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{isUnderReview ? 'In Review' : 'Mark Review'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Overview (Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Match Breakdown, Skill Matrix, Model Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Match Breakdown Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Match Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Evaluation against {roleTitle} requirements</p>
              </div>
              <RecommendationBadge recommendation={candidate.recommendation || (atsScore >= 50 ? 'Strong Match' : 'Moderate Match')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Content Similarity Bar */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#121A2F] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Content Similarity</span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    <AnimatedNumber value={similarityScore} suffix="%" />
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, similarityScore))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Cosine similarity with target job description (40% weight).
                </p>
              </div>

              {/* Skill Alignment Bar */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#121A2F] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Skill Alignment</span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    <AnimatedNumber value={skillScore} suffix="%" />
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, skillScore))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Required technical competencies match (60% weight).
                </p>
              </div>
            </div>
          </div>

          {/* Skill Matrix Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Skill Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Technical competencies identified in the resume</p>
            </div>

            {/* Matched Skills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Matched Skills ({matchedSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Missing Skills ({missingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700"
                  >
                    <span>-</span>
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Collapsible Section: Model Details (Requirement 10) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm">
            <button
              onClick={() => setShowModelDetails(!showModelDetails)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span>Model Details (Technical Diagnostics)</span>
              </div>
              {showModelDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showModelDetails && (
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400">Classification Model:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300">Linear Support Vector Classifier (LinearSVC)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Domain Classes:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300">24 Industry Categories</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Feature Extraction:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300">TF-IDF Vectorizer (Max Features: 5,000)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Similarity Metric:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300">Cosine Distance Matrix</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Formula: Final ATS Score = (Job Similarity * 0.40) + (Skill Alignment * 0.60).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Candidate Overview & Screening History (Screenshot 2) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Candidate Overview Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm space-y-3">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
              Candidate Overview
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Candidate ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">#{cId}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Domain</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{category}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Engine</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">TF-IDF + LinearSVC</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">Evaluated</span>
              </div>
            </div>
          </div>

          {/* Screening History Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm space-y-3">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
              Screening History
            </h3>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121A2F] border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{roleTitle}</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{atsScore}%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{new Date().toLocaleDateString()}</span>
                <span>{candidate.recommendation || 'Moderate Match'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Resume Viewer Modal (Requirement 9) */}
      <ResumeViewerModal
        candidateId={cId}
        candidateName={cName}
        fileName={fileName}
        resumeText={candidate.extractedTextPreview || candidate.resume_preview || ''}
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </div>
  );
}
