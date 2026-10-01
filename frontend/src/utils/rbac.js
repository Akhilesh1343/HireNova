/**
 * HireNova Role-Based Access Control (RBAC) System
 * Enforces strict 4 enterprise roles: Admin, Recruiter, Hiring Manager, HR Lead.
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

export function normalizeRole(role) {
  if (!role) return ROLES.RECRUITER;
  const clean = role.toLowerCase().trim().replace(/[\s-]/g, '_');
  if (clean === 'admin' || clean === 'administrator') return ROLES.ADMIN;
  if (clean === 'hiring_manager' || clean === 'manager') return ROLES.HIRING_MANAGER;
  if (clean === 'hr_lead' || clean === 'hr') return ROLES.HR_LEAD;
  return ROLES.RECRUITER;
}

export function formatRole(role) {
  const norm = normalizeRole(role);
  return ROLE_LABELS[norm] || 'Recruiter';
}

/**
 * Tab and Page Permissions per Role
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
    'reports',
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
    'reports',
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
 * Check if a role is permitted to access a specific tab/resource
 */
export function hasPermission(userRole, tabId) {
  const normalized = normalizeRole(userRole);
  const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[ROLES.RECRUITER];
  return permissions.includes(tabId);
}

/**
 * Default landing tab when logging in as a specific role
 */
export function getRoleDefaultTab(userRole) {
  const normalized = normalizeRole(userRole);
  switch (normalized) {
    case ROLES.ADMIN:
      return 'dashboard';
    case ROLES.RECRUITER:
      return 'dashboard';
    case ROLES.HIRING_MANAGER:
      return 'dashboard';
    case ROLES.HR_LEAD:
      return 'dashboard';
    default:
      return 'dashboard';
  }
}
