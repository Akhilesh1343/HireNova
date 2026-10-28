/**
 * Centralized API client for communicating with the FastAPI backend.
 * Uses VITE_API_BASE_URL environment variable with fallback to http://127.0.0.1:8000.
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000')
  .replace('localhost', '127.0.0.1');
export const API_BASE_URL = `${RAW_BASE.replace(/\/$/, '')}/api`;

const TOKEN_STORAGE_KEY = 'talent_ai_jwt_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getAuthHeaders(extra = {}) {
  const token = getAuthToken();
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper to handle fetch responses and extract helpful error messages
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Server error (HTTP ${response.status})`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      errorMsg = (await response.text()) || errorMsg;
    }
    throw new Error(errorMsg);
  }
  if (response.status === 204) return null;
  return response.json();
}

// ==========================================
// AUTHENTICATION APIS
// ==========================================

export async function loginApi({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(response);
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerApi({ email, password, full_name, company_name, role = 'Recruiter' }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, company_name, role }),
  });
  const data = await handleResponse(response);
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function forgotPasswordApi({ email }) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
}

export async function resetPasswordApi({ token, new_password, confirm_password }) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password, confirm_password }),
  });
  return handleResponse(response);
}

export async function getMeApi() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getUserProfileApi() {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateProfileApi(profileData) {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profileData),
  });
  return handleResponse(response);
}

export async function uploadAvatarApi(formData) {
  const response = await fetch(`${API_BASE_URL}/users/avatar`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

export async function changePasswordApi({ current_password, new_password, confirm_password }) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ current_password, new_password, confirm_password }),
  });
  return handleResponse(response);
}

export async function updatePreferencesApi(preferences) {
  const response = await fetch(`${API_BASE_URL}/users/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(preferences),
  });
  return handleResponse(response);
}

// ==========================================
// RBAC: USER MANAGEMENT & AUDIT LOGS (Admin)
// ==========================================

export async function getUsersApi() {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateUserRoleApi(userId, role) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ role }),
  });
  return handleResponse(response);
}

export async function getActivityLogsApi(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/activity-logs?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getSystemSettingsApi() {
  const response = await fetch(`${API_BASE_URL}/settings/system`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateSystemSettingsApi(settings) {
  const response = await fetch(`${API_BASE_URL}/settings/system`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(settings),
  });
  return handleResponse(response);
}

// ==========================================
// RESUME SCREENING & HISTORY APIS
// ==========================================

export async function screenResumeApi(formData) {
  const response = await fetch(`${API_BASE_URL}/screen-resume`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

export async function screenResumesBatchApi(formData) {
  const response = await fetch(`${API_BASE_URL}/screen-resumes-batch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(response);
}


export async function getScreeningHistoryApi({
  skip = 0,
  limit = 50,
  search = null,
  category = null,
  recommendation = null,
  minAts = 0,
  sortBy = 'created_at',
  sortOrder = 'desc'
} = {}) {
  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  if (search && search.trim()) params.append('search', search.trim());
  if (category && category !== 'ALL') params.append('category', category);
  if (recommendation && recommendation !== 'ALL') params.append('recommendation', recommendation);
  if (minAts > 0) params.append('min_ats', minAts.toString());
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  const response = await fetch(`${API_BASE_URL}/screenings?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getScreeningDetailApi(screeningId) {
  const response = await fetch(`${API_BASE_URL}/screenings/${screeningId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function deleteScreeningApi(screeningId) {
  const response = await fetch(`${API_BASE_URL}/screenings/${screeningId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getResumesApi() {
  const response = await fetch(`${API_BASE_URL}/resumes`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// ==========================================
// JOB DESCRIPTIONS MANAGEMENT APIS
// ==========================================

export async function getJobsApi() {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createJobApi(jobPayload) {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(jobPayload),
  });
  return handleResponse(response);
}

export async function getJobByIdApi(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateJobApi(jobId, jobPayload) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(jobPayload),
  });
  return handleResponse(response);
}

export async function deleteJobApi(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// ==========================================
// CANDIDATES & ANALYTICS APIS
// ==========================================

export async function getDashboardSummaryApi() {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
  return handleResponse(response);
}

export async function getInterviewsApi() {
  const response = await fetch(`${API_BASE_URL}/interviews`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createInterviewApi(payload) {
  const response = await fetch(`${API_BASE_URL}/interviews`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteInterviewApi(interviewId) {
  const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getCandidatesApi({
  skip = 0,
  limit = 50,
  category = null,
  search = null,
  minAts = 0,
  sortBy = 'Rank',
  sortOrder = 'asc'
} = {}) {
  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  if (category && category !== 'ALL') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());
  if (minAts > 0) params.append('min_ats', minAts.toString());
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  const response = await fetch(`${API_BASE_URL}/candidates?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getTopCandidatesApi(limit = 10) {
  const response = await fetch(`${API_BASE_URL}/candidates/top?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getCandidateByIdApi(candidateId) {
  const response = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getAnalyticsApi() {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function analyzeJobApi(payload) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getSkillsApi() {
  const response = await fetch(`${API_BASE_URL}/skills`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function checkHealthApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    try {
      const fallback = await fetch(`${RAW_BASE}/health`);
      return fallback.ok;
    } catch {
      return false;
    }
  }
}

export async function getHealthStatusApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // ignore
  }
  try {
    const fallback = await fetch(`${RAW_BASE}/health`);
    if (fallback.ok) {
      return await fallback.json();
    }
  } catch {
    // ignore
  }
  return { status: 'offline', model_loaded: false, database_connected: false };
}

// ==========================================
// CSV & DATA EXPORT HELPERS (Authenticated)
// ==========================================

export async function downloadAuthenticatedExport(endpointUrl, fallbackFilename) {
  const token = getAuthToken();
  const response = await fetch(endpointUrl, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let err = 'Export failed';
    try {
      const j = await response.json();
      if (j && j.detail) err = j.detail;
    } catch {
      err = await response.text();
    }
    throw new Error(err || 'Export failed');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function getExportRankingsUrl() {
  return `${API_BASE_URL}/export/rankings`;
}

export function getExportShortlistUrl() {
  return `${API_BASE_URL}/export/shortlist`;
}

export function getExportScreeningsUrl() {
  return `${API_BASE_URL}/export/screenings`;
}

export function getExportJsonUrl() {
  return `${API_BASE_URL}/export/json`;
}

export function getCandidateResumeViewUrl(candidateId) {
  const token = getAuthToken();
  const base = `${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}/resume`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function getCandidateResumeDownloadUrl(candidateId) {
  const token = getAuthToken();
  const base = `${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}/resume/download`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Authenticated resume blob fetcher with JWT Authorization header.
 * Used by ResumeViewerModal to load PDFs securely via Blob URL.
 */
export async function fetchCandidateResumeBlob(candidateId) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}/resume`, {
    headers,
  });

  if (response.status === 401) {
    const err = new Error('Could not validate credentials or session has expired. Please sign in again.');
    err.status = 401;
    err.isAuthError = true;
    throw err;
  }

  if (!response.ok) {
    let errorMsg = `Server error (HTTP ${response.status})`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'application/pdf';
  return { blob, contentType };
}

/**
 * Authenticated file downloader with JWT Authorization header.
 * Triggers clean browser download using temporary object URL.
 */
export async function downloadCandidateResumeFile(candidateId, defaultFilename = null) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}/resume/download`, {
    headers,
  });

  if (response.status === 401) {
    const err = new Error('Could not validate credentials or session has expired. Please sign in again.');
    err.status = 401;
    err.isAuthError = true;
    throw err;
  }

  if (!response.ok) {
    let errorMsg = `Download failed (HTTP ${response.status})`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  let filename = defaultFilename;
  const disposition = response.headers.get('Content-Disposition') || '';
  if (!filename && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = match[1];
    }
  }
  if (!filename) {
    filename = `Resume_${candidateId}.pdf`;
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}



