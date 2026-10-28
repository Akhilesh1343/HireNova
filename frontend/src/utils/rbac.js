/**
 * HireNova Role-Based Access Control (RBAC) System
 * Strict enterprise roles: Admin, Recruiter, Hiring Manager, HR Lead.
 * Public visitors can ONLY access the Dashboard/Landing page without logging in.
 */

export const ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  HR_LEAD: 'hr_lead'
};

export const ROLE_LABELS = {
  admin: 'Admin',
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring Manager',
  hr_lead: 'HR Lead'
};

/**
 * Public registration roles allowlist.
 * CRITICAL: Admin is NEVER allowed in registration or role selection.
 */
export const REGISTRATION_ROLES = [
  { value: ROLES.RECRUITER, label: 'Recruiter', description: 'Screen resumes, manage jobs & shortlists' },
  { value: ROLES.HIRING_MANAGER, label: 'Hiring Manager', description: 'Review candidates & interview pipelines' },
  { value: ROLES.HR_LEAD, label: 'HR Lead', description: 'Recruitment oversight, analytics & reports' }
];

export function normalizeRole(role) {
  if (!role) return null;
  const clean = String(role).toLowerCase().trim().replace(/[\s-]/g, '_');
  if (clean === 'admin' || clean === 'administrator') return ROLES.ADMIN;
  if (clean === 'hiring_manager' || clean === 'manager') return ROLES.HIRING_MANAGER;
  if (clean === 'hr_lead' || clean === 'hr') return ROLES.HR_LEAD;
  if (clean === 'recruiter') return ROLES.RECRUITER;
  return clean;
}

export function formatRole(role) {
  const norm = normalizeRole(role);
  if (!norm) return 'Visitor';
  return ROLE_LABELS[norm] || 'Recruiter';
}

/**
 * Tab and Page Permissions per Authenticated Role
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'dashboard',
    'jobs',
    'candidates',
    'rankings',
    'screening',
    'shortlist',
    'interviews',
    'analytics',
    'reports',
    'history',
    'result',
    'users',
    'activity',
    'settings'
  ],
  [ROLES.RECRUITER]: [
    'dashboard',
    'jobs',
    'candidates',
    'rankings',
    'screening',
    'shortlist',
    'interviews',
    'history',
    'result',
    'settings'
  ],
  [ROLES.HIRING_MANAGER]: [
    'dashboard',
    'jobs',
    'candidates',
    'rankings',
    'shortlist',
    'interviews',
    'result',
    'settings'
  ],
  [ROLES.HR_LEAD]: [
    'dashboard',
    'jobs',
    'candidates',
    'rankings',
    'shortlist',
    'interviews',
    'analytics',
    'reports',
    'result',
    'settings'
  ]
};

/**
 * Check if a role is permitted to access a specific tab/resource.
 * Unauthenticated users (userRole = null/undefined) are ONLY permitted to view 'dashboard' and 'landing'.
 */
export function hasPermission(userRole, tabId) {
  if (!tabId) return true;
  const publicTabs = ['dashboard', 'landing'];
  if (publicTabs.includes(tabId)) {
    return true;
  }

  // If not authenticated, all other tabs require sign-in
  if (!userRole) {
    return false;
  }

  const normalized = normalizeRole(userRole);
  if (!normalized) return false;

  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(tabId);
}

/**
 * Default landing tab when logging in as a specific role
 */
export function getRoleDefaultTab(userRole) {
  return 'dashboard';
}

