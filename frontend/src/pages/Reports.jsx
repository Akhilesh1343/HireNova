import React, { useState } from 'react';
import { Download, FileText, Star, Database, CheckCircle, Info } from 'lucide-react';
import {
  getExportRankingsUrl,
  getExportShortlistUrl,
  getExportScreeningsUrl,
  getExportJsonUrl
} from '../services/api';

export default function Reports() {
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const triggerDownload = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Reports &amp; Exports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Download recruitment data and generate audit-ready candidate reports.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">All Jobs</option>
          <option value="python">Python Developer</option>
          <option value="fullstack">Full Stack Engineer</option>
          <option value="software">Software Engineer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="evaluated">Evaluated</option>
          <option value="pending">Pending Review</option>
        </select>

        {downloadSuccess && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{downloadSuccess} downloaded successfully</span>
          </div>
        )}
      </div>

      {/* 3 Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Candidate Report (CSV) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Candidate Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              All candidates with match scores, job similarity, category, and matched skills in standard CSV.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => triggerDownload(getExportRankingsUrl(), 'Candidate Report')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Shortlist Report (CSV) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Shortlist Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Targeted list of shortlisted candidates who passed the match threshold, formatted for hiring manager review.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => triggerDownload(getExportShortlistUrl(), 'Shortlist Report')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Shortlist</span>
            </button>
          </div>
        </div>

        {/* 3. Full Data Export (JSON) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1424] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Full Data Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Complete candidate records, job openings, and screening audit trail in structured JSON format.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => triggerDownload(getExportJsonUrl(), 'Full Data JSON')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Report Filters Info Box */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E1424]/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-medium text-slate-800 dark:text-slate-200">Export Information</span>
          <p>
            Exports reflect your current candidate rankings and screening history. CSV exports include candidate ID, name, target role, domain classification, match score, job similarity, skill score, recommendation, and matched technical skills.
          </p>
        </div>
      </div>
    </div>
  );
}
