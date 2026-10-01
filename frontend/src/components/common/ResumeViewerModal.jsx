import React, { useState } from 'react';
import { X, Download, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { getCandidateResumeViewUrl, getCandidateResumeDownloadUrl } from '../../services/api';

export default function ResumeViewerModal({ candidateId, candidateName, fileName, resumeText, isOpen, onClose }) {
  const [loadError, setLoadError] = useState(false);

  if (!isOpen) return null;

  const viewUrl = candidateId ? getCandidateResumeViewUrl(candidateId) : null;
  const downloadUrl = candidateId ? getCandidateResumeDownloadUrl(candidateId) : null;
  const isPdf = (fileName || '').toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-backdrop">
      <div 
        className="w-full max-w-4xl h-[90vh] bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#121A2F]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {candidateName ? `${candidateName}'s Resume` : 'Candidate Resume'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {fileName || 'Uploaded resume document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm btn-interactive"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content: Live IFrame or Clean Text Preview */}
        <div className="flex-1 bg-slate-100 dark:bg-[#090D18] overflow-hidden relative">
          {!loadError && viewUrl ? (
            <iframe
              src={viewUrl}
              title="Resume Preview"
              className="w-full h-full border-0 bg-white dark:bg-[#0E1424]"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="p-6 h-full overflow-y-auto font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-[#0B1020]">
              {loadError && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Displaying extracted resume text preview. Use the download button above to get the original file.</span>
                </div>
              )}
              {resumeText || 'No text extracted from this resume.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
