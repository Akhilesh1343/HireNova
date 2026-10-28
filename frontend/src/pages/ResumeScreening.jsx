import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Plus,
  Search,
  Download,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
  RotateCcw,
  Info,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { RecommendationBadge } from '../components/common/Badge';
import AnimatedNumber from '../components/common/AnimatedNumber';
import ResumeViewerModal from '../components/common/ResumeViewerModal';
import {
  screenBatchResumesWithApi,
  screenResumeWithApi,
  SAMPLE_RESUMES,
  getRequiredSkillsDefault
} from '../services/screeningService';
import { getJobsApi, getCandidateResumeDownloadUrl, downloadCandidateResumeFile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { JOB_TEMPLATES } from '../data/jobTemplates';

export default function ResumeScreening({ onAnalysisComplete, initialJob }) {
  const { openAuthModal } = useAuth();
  // Tabs: 'upload' | 'results'
  const [activeTab, setActiveTab] = useState('upload');

  // Job Opening Selection
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJob?.id || 'tpl-software-engineer');
  const [jobTitle, setJobTitle] = useState(initialJob?.title || 'Software Engineer');
  const [jobDescription, setJobDescription] = useState(initialJob?.description || JOB_TEMPLATES[0].description);
  const [skills, setSkills] = useState(initialJob?.required_skills || JOB_TEMPLATES[0].requiredSkills);

  // Resume Files State (Multiple Resumes)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Screening Execution State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, text: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnectionError, setIsConnectionError] = useState(false);

  // Results State
  const [screeningResults, setScreeningResults] = useState([]);
  const [shortlistSearch, setShortlistSearch] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('ALL');
  const [sortByScore, setSortByScore] = useState('desc');

  // Interactive Resume Modal Viewer
  const [activeResumeViewer, setActiveResumeViewer] = useState(null);

  // Load Company Jobs on Mount
  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await getJobsApi();
        if (data && data.length > 0) {
          setSavedJobs(data);
        }
      } catch (err) {
        console.warn('Could not fetch jobs:', err.message);
      }
    }
    loadJobs();
  }, []);

  // Update when initialJob changes
  useEffect(() => {
    if (initialJob) {
      setSelectedJobId(initialJob.id);
      setJobTitle(initialJob.title);
      setJobDescription(initialJob.description);
      setSkills(initialJob.required_skills || JOB_TEMPLATES[0].requiredSkills);
    }
  }, [initialJob]);

  // Handle Job Selection (from active jobs or templates)
  const handleSelectJob = (e) => {
    const val = e.target.value;
    setSelectedJobId(val);

    // Check if it's a saved DB job
    const saved = savedJobs.find(j => String(j.id) === val);
    if (saved) {
      setJobTitle(saved.title);
      setJobDescription(saved.description);
      setSkills(saved.required_skills || ['python', 'sql', 'git']);
      return;
    }

    // Check if it's a template
    const tpl = JOB_TEMPLATES.find(t => t.id === val);
    if (tpl) {
      setJobTitle(tpl.title);
      setJobDescription(tpl.description);
      setSkills(tpl.requiredSkills);
    }
  };

  // Multiple File Selection & Drag-Drop
  const addFiles = (newFiles) => {
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const filtered = Array.from(newFiles).filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return validExtensions.includes(ext);
    });

    if (filtered.length < newFiles.length) {
      setErrorMessage('Some files were skipped. Only PDF, DOC, DOCX, and TXT are supported.');
    }

    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name + f.size));
      const deduplicated = filtered.filter(f => !existingNames.has(f.name + f.size));
      return [...prev, ...deduplicated];
    });
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Execute Screening (Core Workflow)
  const handleScreenResumes = async () => {
    setErrorMessage('');
    setIsConnectionError(false);

    if (selectedFiles.length === 0) {
      setErrorMessage('Please upload at least one resume to screen.');
      return;
    }

    if (!jobDescription.trim()) {
      setErrorMessage('Please provide a job description.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({
      current: 1,
      total: selectedFiles.length,
      text: `Screening ${selectedFiles.length} resume${selectedFiles.length > 1 ? 's' : ''}...`
    });

    try {
      let results = [];

      if (selectedFiles.length === 1) {
        setAnalysisProgress({
          current: 1,
          total: 1,
          text: `Analyzing ${selectedFiles[0].name}...`
        });

        const singleResult = await screenResumeWithApi({
          file: selectedFiles[0],
          jobDescription,
          requiredSkills: skills,
          jobTitle,
          jobDescriptionId: !isNaN(Number(selectedJobId)) ? Number(selectedJobId) : undefined
        });

        results = [{
          ...singleResult,
          rank: 1
        }];
      } else {
        const batchData = await screenBatchResumesWithApi({
          files: selectedFiles,
          jobDescription,
          requiredSkills: skills,
          jobTitle,
          jobDescriptionId: !isNaN(Number(selectedJobId)) ? Number(selectedJobId) : undefined
        });

        results = batchData.results || [];
      }

      setScreeningResults(results);
      setActiveTab('results');
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('unavailable') ||
        msg.includes('connection')
      ) {
        setIsConnectionError(true);
        setErrorMessage('Unable to connect to the screening service.');
      } else {
        setErrorMessage(msg || 'An error occurred while screening resumes.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export Results as CSV
  const handleExportCSV = () => {
    if (screeningResults.length === 0) return;

    const headers = ['Rank', 'Candidate ID', 'Candidate Name', 'File Name', 'Match Score (%)', 'Similarity (%)', 'Skill Score (%)', 'Matched Skills', 'Missing Skills', 'Recommendation'];
    const rows = screeningResults.map(r => [
      r.rank,
      r.id,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.fileName || '').replace(/"/g, '""')}"`,
      r.atsScore,
      r.similarity,
      r.skillScore,
      `"${(r.matchedSkills || []).join(', ')}"`,
      `"${(r.missingSkills || []).join(', ')}"`,
      `"${r.recommendation}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `HireNova_Screening_${jobTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Results
  const filteredResults = screeningResults
    .filter(c => {
      const term = shortlistSearch.toLowerCase().trim();
      const matchesSearch = !term ||
        c.name.toLowerCase().includes(term) ||
        (c.fileName && c.fileName.toLowerCase().includes(term)) ||
        (c.matchedSkills || []).some(s => s.toLowerCase().includes(term));
      const matchesRec = recommendationFilter === 'ALL' || c.recommendation === recommendationFilter;
      return matchesSearch && matchesRec;
    })
    .sort((a, b) => {
      return sortByScore === 'desc' ? b.atsScore - a.atsScore : a.atsScore - b.atsScore;
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Resume Screening
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload candidate resumes, run AI screening, and receive ranked candidate shortlists instantly.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upload &amp; Screen
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Results</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {screeningResults.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs animate-toast">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-200">
                  {errorMessage}
                </div>
                {isConnectionError && (
                  <p className="text-red-600 dark:text-red-400 mt-1">
                    Please ensure the backend service is running on http://127.0.0.1:8000, then retry.
                  </p>
                )}
                {isConnectionError && (
                  <button
                    onClick={handleScreenResumes}
                    className="btn-interactive mt-2.5 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-md font-medium text-xs shadow-sm"
                  >
                    Retry connection
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD & SCREEN WORKFLOW */}
      {activeTab === 'upload' && (
        <div className="space-y-6 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
          {/* STEP 1: SELECT JOB OPENING */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Select Job Opening *
              </h2>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {skills.length} Required Skills
              </span>
            </div>

            <select
              value={selectedJobId}
              onChange={handleSelectJob}
              className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <optgroup label="Active Company Jobs">
                {savedJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title} ({j.department || 'Engineering'})</option>
                ))}
              </optgroup>
              <optgroup label="Popular Job Templates">
                {JOB_TEMPLATES.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>{tpl.title} (Template)</option>
                ))}
              </optgroup>
            </select>

            {/* Quick Skills Pill Preview */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Target Skills:</span>
              {skills.map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-750"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* STEP 2: UPLOAD MULTIPLE RESUMES */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Upload Resumes (Multiple Supported)
              </h2>
              <span className="text-xs text-slate-400">
                PDF, DOC, DOCX, TXT (up to 10MB each)
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`dropzone-container border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer ${
                isDragging
                  ? 'is-dragging border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-[#121A2F]/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <UploadCloud className="w-9 h-9 mx-auto text-slate-400 dark:text-slate-500 mb-2.5 pointer-events-none transition-transform duration-200 group-hover:scale-105" />

              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 pointer-events-none">
                Drag &amp; drop resumes here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
                Upload multiple candidate resumes for batch analysis and ranking.
              </p>
            </div>

            {/* Selected Resumes List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedFiles.length} resume{selectedFiles.length > 1 ? 's' : ''} ready to screen
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-slate-400 hover:text-red-500 text-xs transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#121A2F] max-h-52 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      style={{ '--row-index': idx }}
                      className="px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors animate-row-enter"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-sm font-medium">{file.name}</span>
                        <span className="text-slate-400 text-[11px] shrink-0 font-mono">({formatBytes(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors ml-2"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informational Tip */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                Tip: Resumes are processed using semantic TF-IDF matching and verified against technical requirements.
              </span>
            </div>

            {/* Screening Progress Bar when isAnalyzing */}
            {isAnalyzing && (
              <div className="space-y-1.5 pt-2 animate-fadeIn">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{analysisProgress.text || 'Processing resumes...'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">Evaluating ML weights...</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full animate-progress-stripe transition-all duration-300 w-full" />
                </div>
              </div>
            )}

            {/* STEP 3: ONE OBVIOUS PRIMARY ACTION */}
            <div className="pt-2">
              <button
                onClick={handleScreenResumes}
                disabled={selectedFiles.length === 0 || isAnalyzing}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm btn-interactive"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{analysisProgress.text || 'Screening Resumes...'}</span>
                  </>
                ) : (
                  <>
                    <span>Screen {selectedFiles.length > 0 ? `${selectedFiles.length} Resumes` : 'Resumes'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCREENING RESULTS (Requirement 8) */}
      {activeTab === 'results' && (
        <div className="space-y-5">
          {/* Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Target Role:</span>{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{jobTitle}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total Screened:</span>{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{screeningResults.length} candidates</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Top Match:</span>{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {screeningResults.length > 0 ? `${Math.round(screeningResults[0].atsScore)}%` : 'N/A'}
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#121A2F] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload More</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={shortlistSearch}
                onChange={(e) => setShortlistSearch(e.target.value)}
                placeholder="Search candidates or skills..."
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={recommendationFilter}
                onChange={(e) => setRecommendationFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Matches</option>
                <option value="Strong Match">Strong Match</option>
                <option value="Good Match">Good Match</option>
                <option value="Moderate Match">Moderate Match</option>
                <option value="Low Match">Low Match</option>
              </select>

              <button
                type="button"
                onClick={() => setSortByScore(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Score: {sortByScore === 'desc' ? 'High → Low' : 'Low → High'}
              </button>
            </div>
          </div>

          {/* Clean Ranked Table (Requirement 8) */}
          <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {filteredResults.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">No Results to Display</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload resumes in the Upload tab and screen candidates to view ranked results.</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
                >
                  Upload Resumes
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 font-medium w-14">Rank</th>
                      <th className="py-3 px-4 font-medium">Candidate</th>
                      <th className="py-3 px-4 font-medium">Match Score</th>
                      <th className="py-3 px-4 font-medium">Matched Skills</th>
                      <th className="py-3 px-4 font-medium">Missing Skills</th>
                      <th className="py-3 px-4 font-medium">Recommendation</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredResults.map((candidate, idx) => {
                      const score = Math.round(candidate.atsScore || candidate.ats_score || 0);
                      const matched = candidate.matchedSkills || candidate.matched_skills || [];
                      const missing = candidate.missingSkills || candidate.missing_skills || [];

                      return (
                        <tr
                          key={candidate.id || idx}
                          style={{ '--row-index': idx }}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors animate-row-enter"
                        >
                          <td className="py-3 px-4 text-slate-400 font-mono font-semibold">
                            #{candidate.rank || idx + 1}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                if (onAnalysisComplete) onAnalysisComplete(candidate);
                              }}
                              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors truncate max-w-xs block"
                            >
                              {candidate.name}
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {candidate.fileName}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold tabular-nums ${score >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                <AnimatedNumber value={score} suffix="%" />
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
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                >
                                  {skill}
                                </span>
                              ))}
                              {matched.length > 3 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{matched.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {missing.slice(0, 2).map(skill => (
                                <span
                                  key={skill}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                >
                                  {skill}
                                </span>
                              ))}
                              {missing.length > 2 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{missing.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <RecommendationBadge recommendation={candidate.recommendation} />
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* View Resume Modal Trigger */}
                              <button
                                onClick={() => setActiveResumeViewer({
                                  id: candidate.id,
                                  name: candidate.name,
                                  fileName: candidate.fileName,
                                  text: candidate.extractedTextPreview || ''
                                })}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="View Uploaded Resume"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Download Resume Direct Trigger with JWT Auth */}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await downloadCandidateResumeFile(candidate.id, candidate.fileName);
                                  } catch (err) {
                                    if (err.isAuthError || err.status === 401) {
                                      if (openAuthModal) openAuthModal('login');
                                    } else {
                                      alert(err.message || 'Failed to download resume file.');
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Download Resume File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (onAnalysisComplete) onAnalysisComplete(candidate);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                              >
                                Profile
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
        </div>
      )}

      {/* Interactive Real Resume Viewer Modal */}
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
