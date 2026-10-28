import React, { useState, useEffect } from 'react';
import { X, Download, FileText, ExternalLink, AlertCircle, ShieldAlert, LogIn, Loader2 } from 'lucide-react';
import {
  fetchCandidateResumeBlob,
  downloadCandidateResumeFile,
  getCandidateResumeViewUrl,
  getAuthToken
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ResumeViewerModal({
  candidateId,
  candidateName,
  fileName,
  resumeText,
  isOpen = true,
  onClose
}) {
  const { openAuthModal } = useAuth();
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch resume securely via authenticated Blob URL
  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    if (!isOpen || !candidateId) {
      setBlobUrl(null);
      setIsLoading(false);
      setIsSessionExpired(false);
      setLoadError(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setIsSessionExpired(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsSessionExpired(false);
    setLoadError(false);
    setErrorMessage('');

    fetchCandidateResumeBlob(candidateId)
      .then(({ blob }) => {
        if (!isMounted) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (err.isAuthError || err.status === 401) {
          setIsSessionExpired(true);
        } else {
          setLoadError(true);
          setErrorMessage(err.message || 'Unable to load resume preview.');
        }
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [candidateId, isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!candidateId) return;
    try {
      setIsDownloading(true);
      await downloadCandidateResumeFile(candidateId, fileName);
    } catch (err) {
      if (err.isAuthError || err.status === 401) {
        setIsSessionExpired(true);
      } else {
        alert(err.message || 'Failed to download resume file.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewWindow = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    } else if (candidateId) {
      const viewUrl = getCandidateResumeViewUrl(candidateId);
      window.open(viewUrl, '_blank');
    }
  };

  const handleSignInAgain = () => {
    if (openAuthModal) {
      openAuthModal('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-backdrop">
      <div
        className="w-full max-w-4xl h-[92vh] max-h-[92vh] bg-white dark:bg-[#0B1210] border border-slate-200 dark:border-emerald-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-emerald-500/15 bg-slate-50/90 dark:bg-[#080D0B]/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {candidateName ? `${candidateName}'s Resume` : 'Candidate Resume'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70 truncate font-mono">
                {fileName || (candidateId ? `Resume_${candidateId}.pdf` : 'Uploaded resume document')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSessionExpired && candidateId && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-emerald-200 bg-white dark:bg-[#131F1B] hover:bg-slate-100 dark:hover:bg-emerald-900/30 border border-slate-300 dark:border-emerald-500/30 rounded-lg shadow-sm transition-all disabled:opacity-50"
                title="Download verified resume"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? 'Downloading...' : 'Download'}
                </span>
              </button>
            )}

            {!isSessionExpired && (blobUrl || candidateId) && (
              <button
                type="button"
                onClick={handleOpenInNewWindow}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-emerald-300/80 hover:text-slate-900 dark:hover:text-emerald-200 rounded-lg transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-emerald-200 hover:bg-slate-200/60 dark:hover:bg-emerald-950/40 rounded-lg transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 bg-slate-100 dark:bg-[#050807] overflow-hidden relative flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                Loading Candidate Document
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Authenticating recruiter session and loading resume preview securely...
              </p>
            </div>
          ) : isSessionExpired ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/50">
                <ShieldAlert className="w-7 h-7 text-emerald-400" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Authentication Required
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Could not validate credentials or your session has expired. Resumes contain protected candidate data. Please sign in again to access and preview resumes.
              </p>
              <div className="mt-6 flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleSignInAgain}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In Again</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-[#131F1B] hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !loadError && blobUrl ? (
            <iframe
              src={blobUrl}
              title="Resume Preview"
              className="w-full h-full border-0 bg-white dark:bg-[#0B1210]"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="p-6 h-full overflow-y-auto font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-[#0B1210]">
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  {errorMessage || 'Direct PDF rendering unavailable for this file format.'} Displaying parsed resume text preview below.
                </span>
              </div>
              {resumeText || 'No text content available for this candidate resume.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
