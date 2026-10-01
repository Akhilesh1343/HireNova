import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ShieldCheck,
  Bell,
  Palette,
  Sliders,
  Check,
  Save,
  RotateCcw,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Building,
  Mail,
  Shield,
  FileCheck,
  Cpu,
  Layers,
  Users,
  Activity,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { normalizeRole, formatRole, ROLES } from '../utils/rbac';
import {
  updateProfileApi,
  uploadAvatarApi,
  changePasswordApi,
  updatePreferencesApi,
  getSystemSettingsApi,
  updateSystemSettingsApi
} from '../services/api';

export default function SettingsPage({ onNavigateTab }) {
  const { user, isAuthenticated, logout, openAuthModal, updateUserProfile } = useAuth();
  const { theme, isDark, setTheme } = useTheme();

  // Role validation
  const userRole = normalizeRole(user?.role);
  const isAdmin = userRole === ROLES.ADMIN;

  // Active section state: 'profile' | 'security' | 'notifications' | 'appearance' | 'system'
  const [activeSection, setActiveSection] = useState('profile');

  // If non-admin somehow navigates to 'system', redirect to 'profile'
  useEffect(() => {
    if (!isAdmin && activeSection === 'system') {
      setActiveSection('profile');
    }
  }, [isAdmin, activeSection]);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState(user?.company_name || 'HireNova Talent Solutions');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const fileInputRef = useRef(null);

  // Password / Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification Preferences State
  const [notifications, setNotifications] = useState(() => {
    const existing = user?.notification_preferences;
    return {
      candidate_matches: existing?.candidate_matches ?? true,
      new_applications: existing?.new_applications ?? true,
      interview_reminders: existing?.interview_reminders ?? true,
      weekly_digest: existing?.weekly_digest ?? false,
      security_alerts: existing?.security_alerts ?? true
    };
  });

  // Appearance State
  const [displayDensity, setDisplayDensity] = useState(() => {
    return localStorage.getItem('hirenova_display_density') || 'comfortable';
  });

  // Admin System Settings State
  const [similarityWeight, setSimilarityWeight] = useState(() => {
    try {
      return Number(localStorage.getItem('hirenova_similarity_weight')) || 40;
    } catch {
      return 40;
    }
  });
  const [skillWeight, setSkillWeight] = useState(100 - similarityWeight);
  const [shortlistThreshold, setShortlistThreshold] = useState(() => {
    try {
      return Number(localStorage.getItem('hirenova_shortlist_threshold')) || 50;
    } catch {
      return 50;
    }
  });
  const [autoTagging, setAutoTagging] = useState(true);
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [systemSettingsError, setSystemSettingsError] = useState(null);

  // Feedback State
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  // Sync state when user prop updates
  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.email) setEmailAddress(user.email);
      if (user.company_name) setCompanyName(user.company_name);
      if (user.avatar_url) setAvatarPreview(user.avatar_url);
      if (user.notification_preferences) {
        setNotifications((prev) => ({ ...prev, ...user.notification_preferences }));
      }
    }
  }, [user]);

  // Load backend system settings if Admin
  useEffect(() => {
    if (isAdmin) {
      let isMounted = true;
      getSystemSettingsApi()
        .then((data) => {
          if (isMounted && data) {
            if (data.similarity_weight_default !== undefined) {
              setSimilarityWeight(data.similarity_weight_default);
              setSkillWeight(100 - data.similarity_weight_default);
            }
            if (data.shortlist_threshold_default !== undefined) {
              setShortlistThreshold(data.shortlist_threshold_default);
            }
            if (data.candidate_auto_tagging !== undefined) {
              setAutoTagging(data.candidate_auto_tagging);
            }
            if (data.duplicate_resume_detection !== undefined) {
              setDuplicateDetection(data.duplicate_resume_detection);
            }
            if (data.data_retention_days !== undefined) {
              setDataRetentionDays(data.data_retention_days);
            }
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.warn('[Settings] Failed to fetch system settings:', err.message);
          }
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isAdmin]);

  const showFeedbackMessage = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 3500);
  };

  // Avatar upload handler
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showFeedbackMessage('error', 'Profile photo must be smaller than 5MB.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAvatarApi(formData);
      if (res && res.avatar_url) {
        setAvatarPreview(res.avatar_url);
        updateUserProfile({ avatar_url: res.avatar_url });
        showFeedbackMessage('success', 'Profile photo updated successfully!');
      }
    } catch (err) {
      // Fallback: Read as Base64 data URL locally
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        setAvatarPreview(base64);
        try {
          const updated = await updateProfileApi({ avatar_url: base64 });
          updateUserProfile(updated);
          showFeedbackMessage('success', 'Profile photo updated successfully!');
        } catch (innerErr) {
          showFeedbackMessage('error', innerErr.message || 'Failed to update photo.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const updated = await updateProfileApi({ avatar_url: '' });
      setAvatarPreview('');
      updateUserProfile({ avatar_url: null });
      showFeedbackMessage('success', 'Profile photo removed.');
    } catch (err) {
      showFeedbackMessage('error', err.message || 'Failed to remove photo.');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      showFeedbackMessage('error', 'Full name must be at least 2 characters.');
      return;
    }
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      showFeedbackMessage('error', 'Please enter a valid work email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateProfileApi({
        full_name: fullName.trim(),
        email: emailAddress.trim(),
        company_name: companyName.trim(),
        avatar_url: avatarPreview || null
      });
      updateUserProfile(updated);
      showFeedbackMessage('success', 'Profile changes saved successfully!');
    } catch (err) {
      showFeedbackMessage('error', err.message || 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setSecurityStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setSecurityStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setSecurityStatus(null);
    try {
      await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSecurityStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecurityStatus(null), 4000);
    } catch (err) {
      setSecurityStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    try {
      const updated = await updatePreferencesApi({
        notification_preferences: notifications
      });
      updateUserProfile(updated);
      showFeedbackMessage('success', 'Notification preferences saved successfully!');
    } catch (err) {
      showFeedbackMessage('error', err.message || 'Failed to save notification preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Save Appearance
  const handleSaveAppearance = async (targetTheme) => {
    if (targetTheme) {
      setTheme(targetTheme);
    }
    const chosenTheme = targetTheme || (isDark ? 'dark' : 'light');
    try {
      localStorage.setItem('hirenova_display_density', displayDensity);
      const updated = await updatePreferencesApi({
        theme_preference: chosenTheme
      });
      updateUserProfile(updated);
      showFeedbackMessage('success', `Theme switched to ${chosenTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}!`);
    } catch (err) {
      // Local theme toggle already works
      showFeedbackMessage('success', `Theme preference updated.`);
    }
  };

  // Admin AI Weights slider handler
  const handleSimilarityChange = (e) => {
    const val = Number(e.target.value);
    setSimilarityWeight(val);
    setSkillWeight(100 - val);
  };

  // Save Admin System Settings
  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedbackMessage('error', 'Only Administrators have permission to modify system settings.');
      return;
    }

    setIsSavingSystem(true);
    try {
      localStorage.setItem('hirenova_similarity_weight', String(similarityWeight));
      localStorage.setItem('hirenova_shortlist_threshold', String(shortlistThreshold));

      await updateSystemSettingsApi({
        similarity_weight_default: similarityWeight,
        skill_weight_default: skillWeight,
        shortlist_threshold_default: shortlistThreshold,
        candidate_auto_tagging: autoTagging,
        duplicate_resume_detection: duplicateDetection,
        data_retention_days: dataRetentionDays
      });

      showFeedbackMessage('success', 'System AI configuration saved successfully across the platform.');
    } catch (err) {
      showFeedbackMessage('error', err.message || 'Failed to update system settings.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleResetSystemSettings = () => {
    setSimilarityWeight(40);
    setSkillWeight(60);
    setShortlistThreshold(50);
    setAutoTagging(true);
    setDuplicateDetection(true);
    setDataRetentionDays(365);
    showFeedbackMessage('info', 'System screening parameters reset to defaults (40% similarity, 60% skills, 50% threshold).');
  };

  // Define tab items: Profile, Security, Notifications, Appearance, and System Settings (Admin only)
  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, adminOnly: false },
    { id: 'security', label: 'Account & Security', icon: ShieldCheck, adminOnly: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: false },
    { id: 'appearance', label: 'Appearance', icon: Palette, adminOnly: false },
    ...(isAdmin
      ? [{ id: 'system', label: 'System Settings', icon: Sliders, adminOnly: true }]
      : [])
  ];

  // User initial fallback
  const userInitial = (fullName || user?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Settings</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              {formatRole(user?.role)}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, credentials, notifications and system preferences
          </p>
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={fullName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitial}
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {fullName || 'Authenticated User'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {emailAddress || 'user@hirenova.com'}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-all inline-flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.adminOnly && (
                <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all shadow-xs ${
            feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
              : feedback.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          ) : feedback.type === 'info' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MY PROFILE SECTION (Accessible to ALL authenticated roles) */}
      {/* ========================================================================= */}
      {activeSection === 'profile' && (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              My Profile Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your personal identity, avatar photo, and organization information
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar & Photo Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600 dark:border-indigo-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                      {userInitial}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Change profile photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Profile Photo
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Accepted formats: JPG, PNG, WEBP or SVG (Max 5MB)
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 rounded-md hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 btn-interactive"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md transition-colors inline-flex items-center gap-1 btn-interactive"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div className="sm:text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Workspace Role
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{formatRole(user?.role)}</span>
                </span>
              </div>
            </div>

            {/* Profile Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Sarah Jenkins"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Work Email Address</span>
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="sarah.jenkins@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company / Organization Name</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="HireNova Talent Inc."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role Authorization</span>
                </label>
                <input
                  type="text"
                  value={formatRole(user?.role)}
                  disabled
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-[#080B14]/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Role assignments are managed by System Administrators in User Management.
                </p>
              </div>
            </div>

            {/* Account Information Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Account Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Account ID</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    #HN-{user?.id || '101'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Member Since</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Access Scope</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {isAdmin ? 'System Full Control' : 'Recruitment Workspace'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors inline-flex items-center gap-1.5 btn-interactive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-lg transition-colors inline-flex items-center gap-1.5 btn-interactive"
                >
                  <span>Sign In</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm btn-interactive"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACCOUNT & SECURITY SECTION (Change password, active session) */}
      {/* ========================================================================= */}
      {activeSection === 'security' && (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Account &amp; Security
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your credentials, update your password, and view active sessions
            </p>
          </div>

          {securityStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                securityStatus.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {securityStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <span className="font-medium">{securityStatus.message}</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                  <span className="text-slate-400">Strength:</span>
                  <span
                    className={`font-semibold ${
                      newPassword.length >= 10
                        ? 'text-emerald-500'
                        : newPassword.length >= 8
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}
                  >
                    {newPassword.length >= 10 ? 'Strong' : newPassword.length >= 8 ? 'Good' : 'Too Short'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm btn-interactive"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>

          {/* Active Session Info */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Active Session &amp; Security
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    Windows • Active Browser Session
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Authorized via JWT Bearer Token • Endpoint: 127.0.0.1:8000
                  </div>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto btn-interactive"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Terminate Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS SECTION (Preferences for alerts and digests) */}
      {/* ========================================================================= */}
      {activeSection === 'notifications' && (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Notification Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control when and how you receive alerts regarding candidate screenings and shortlists
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4 max-w-xl">
            {/* Toggle 1: High Match Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]">
              <div className="pr-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Candidate Shortlist Alerts
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive instant alerts when a screened resume scores above the qualification threshold.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, candidate_matches: !prev.candidate_matches }))
                }
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.candidate_matches ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifications.candidate_matches ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: New Batch Applications */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]">
              <div className="pr-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Batch Screening Completion
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Get notified when bulk resume uploads finish AI classification and parsing.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, new_applications: !prev.new_applications }))
                }
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.new_applications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifications.new_applications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Interview Reminders */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]">
              <div className="pr-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Interview Schedule Reminders
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive automated reminders 1 hour before scheduled candidate interviews.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    interview_reminders: !prev.interview_reminders
                  }))
                }
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.interview_reminders ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifications.interview_reminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4: Weekly Digest */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]">
              <div className="pr-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Weekly Recruitment Analytics Digest
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive a summary of hiring pipeline metrics, top category matches, and ATS statistics.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, weekly_digest: !prev.weekly_digest }))
                }
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.weekly_digest ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifications.weekly_digest ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 5: Security Notices */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]">
              <div className="pr-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Account &amp; Security Alerts
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Important notices concerning password updates, session logins, and role adjustments.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, security_alerts: !prev.security_alerts }))
                }
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.security_alerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifications.security_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPreferences}
                className="px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm btn-interactive"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingPreferences ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPEARANCE SECTION (Dark/Light theme) */}
      {/* ========================================================================= */}
      {activeSection === 'appearance' && (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Interface Theme &amp; Display
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your visual theme and table display density for comfortable recruiting
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Color Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => handleSaveAppearance('dark')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isDark
                    ? 'border-indigo-500 bg-[#080B14] text-white ring-1 ring-indigo-500/50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800/50">
                    <Moon className="w-4 h-4" />
                  </div>
                  {isDark && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Dark Theme</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deep navy &amp; near-black surface. Reduced eye strain for high-focus screening.
                </p>
              </button>

              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => handleSaveAppearance('light')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  !isDark
                    ? 'border-indigo-500 bg-white text-slate-900 ring-1 ring-indigo-500/50 shadow-sm'
                    : 'border-slate-800 bg-[#080B14] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Sun className="w-4 h-4" />
                  </div>
                  {!isDark && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Light Theme</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Crisp daylight workspace with WCAG high-contrast clarity.
                </p>
              </button>
            </div>
          </div>

          {/* Display Density */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 max-w-lg">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Candidate Table Density
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDisplayDensity('comfortable');
                  localStorage.setItem('hirenova_display_density', 'comfortable');
                }}
                className={`px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                  displayDensity === 'comfortable'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="font-medium">Comfortable</div>
                <div className="text-[10px] text-slate-400">Generous padding &amp; badges</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDisplayDensity('compact');
                  localStorage.setItem('hirenova_display_density', 'compact');
                }}
                className={`px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                  displayDensity === 'compact'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="font-medium">Compact</div>
                <div className="text-[10px] text-slate-400">Higher information density</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM SETTINGS (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {activeSection === 'system' && isAdmin && (
        <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  System &amp; AI Screening Settings
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calibrate global machine learning scoring weights, threshold filters, and system models
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetSystemSettings}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <form onSubmit={handleSaveSystemSettings} className="space-y-6 max-w-xl">
            {/* 1. Screening Match Weights */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Scoring Model Calibration
              </h3>

              {/* Slider 1: Content Similarity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">
                    Content / Job Description Similarity:
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {similarityWeight}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={similarityWeight}
                  onChange={handleSimilarityChange}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Slider 2: Skill Alignment */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">
                    Skill Alignment / Technical Match:
                  </span>
                  <span className="font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                    {skillWeight}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={skillWeight}
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">
                  Automatically complements content similarity to ensure weights sum to 100%.
                </p>
              </div>

              {/* Formula display */}
              <div className="p-2.5 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                Composite ATS Score = ({similarityWeight}% × Cosine Similarity) + ({skillWeight}% × Skill Overlap)
              </div>
            </div>

            {/* 2. Qualification Threshold */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Automatic Shortlist Threshold
              </h3>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-slate-300">
                  Minimum Score for Auto-Qualification:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {shortlistThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="85"
                step="5"
                value={shortlistThreshold}
                onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Candidates with a composite match score &gt;= {shortlistThreshold}% are flagged as Qualified / Shortlisted.
              </p>
            </div>

            {/* 3. System Model & Pipeline Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Machine Learning Model Architecture
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Classifier</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    LinearSVC (Scikit-Learn)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Feature Extraction</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    TF-IDF Vectorizer
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Max File Upload Size</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">10 MB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Allowed Formats</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">PDF, DOCX, TXT</span>
                </div>
              </div>
            </div>

            {/* 4. System-Wide Recruitment Toggles */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080B14] border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Recruitment Automation Controls
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Candidate Auto-Tagging
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatically tag candidates based on predicted industry categories.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTagging(!autoTagging)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    autoTagging ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                      autoTagging ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Duplicate Resume Detection
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Flag matching candidate emails or identical resume contents.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateDetection(!duplicateDetection)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    duplicateDetection ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                      duplicateDetection ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Links to User Management and Activity Logs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('hirenova_active_tab', 'users');
                    window.location.hash = 'users';
                    window.location.reload();
                  } catch (e) {}
                }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50/50 dark:bg-[#080B14] text-left transition-all group"
              >
                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Open</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  User &amp; Role Management
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Assign Recruiter, Hiring Manager, or HR Lead roles
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('hirenova_active_tab', 'activity');
                    window.location.hash = 'activity';
                    window.location.reload();
                  } catch (e) {}
                }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50/50 dark:bg-[#080B14] text-left transition-all group"
              >
                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Open</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  System Audit Logs
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Inspect login attempts and administrative events
                </p>
              </button>
            </div>

            {/* Save System Settings Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSystem}
                className="px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm btn-interactive"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSystem ? 'Saving Configuration...' : 'Save System Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
