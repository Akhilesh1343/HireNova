import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  {
    id: 'Recruiter',
    title: 'Recruiter',
    description: 'Manage candidates and resume screening.'
  },
  {
    id: 'Hiring Manager',
    title: 'Hiring Manager',
    description: 'Review candidates and make hiring decisions.'
  },
  {
    id: 'HR Lead',
    title: 'HR Lead',
    description: 'Monitor recruitment activity and team performance.'
  }
];

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700', width: '0%' };
  let points = 0;
  if (pass.length >= 8) points += 1;
  if (pass.length >= 12) points += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) points += 1;
  if (/[0-9]/.test(pass)) points += 1;
  if (/[^A-Za-z0-9]/.test(pass)) points += 1;

  if (points <= 2) {
    return { score: 1, label: 'Weak (min 8 chars, mix case/numbers)', color: 'bg-red-500', width: '33%' };
  } else if (points <= 3) {
    return { score: 2, label: 'Medium', color: 'bg-amber-500', width: '66%' };
  } else {
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthModal({ onLoginSuccess }) {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authView,
    setAuthView,
    resetToken,
    setResetToken,
    prefilledEmail,
    login,
    register,
    forgotPassword,
    resetPassword
  } = useAuth();

  // Active view: 'login' | 'register' | 'forgot-password' | 'reset-password'
  const [currentView, setCurrentView] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState('Recruiter');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [accountCreatedSuccess, setAccountCreatedSuccess] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [devResetToken, setDevResetToken] = useState('');

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetCompletedSuccess, setResetCompletedSuccess] = useState(false);

  // Shared status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Synchronize view with context
  useEffect(() => {
    if (authView) {
      setCurrentView(authView);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [authView]);

  // Load remembered email on open
  useEffect(() => {
    if (isAuthModalOpen) {
      const savedEmail = localStorage.getItem('hirenova_remembered_email') || localStorage.getItem('recruitx_remembered_email');
      if (savedEmail) {
        setLoginEmail(savedEmail);
        setRememberMe(true);
      }
      if (prefilledEmail) {
        setLoginEmail(prefilledEmail);
        setForgotEmail(prefilledEmail);
      }
      if (resetToken) {
        setCurrentView('reset-password');
      }
    }
  }, [isAuthModalOpen, prefilledEmail, resetToken]);

  if (!isAuthModalOpen) return null;

  const switchView = (newView) => {
    setErrorMessage('');
    setSuccessMessage('');
    setAccountCreatedSuccess(false);
    setForgotSubmitted(false);
    setResetCompletedSuccess(false);
    setCurrentView(newView);
    setAuthView(newView);
  };

  // -------------------------------------------------------------
  // 1. LOGIN HANDLER
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(cleanEmail, loginPassword, rememberMe);
      closeAuthModal();
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. REGISTRATION HANDLER
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanFullName = regFullName.trim();
    const cleanEmail = regEmail.trim();
    const cleanCompany = regCompany.trim();

    if (!cleanFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!cleanCompany) {
      setErrorMessage('Please enter your company name.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: cleanEmail,
        password: regPassword,
        full_name: cleanFullName,
        company_name: cleanCompany,
        role: regRole
      });

      // UX requirement: Registration -> Account Created -> Login
      setAccountCreatedSuccess(true);
      setLoginEmail(cleanEmail);
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. FORGOT PASSWORD HANDLER
  // -------------------------------------------------------------
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered work email.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setForgotSubmitted(true);
      if (res && res.reset_token) {
        setDevResetToken(res.reset_token);
        setResetToken(res.reset_token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 4. RESET PASSWORD HANDLER
  // -------------------------------------------------------------
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const tokenToUse = resetToken || devResetToken;

    if (!tokenToUse) {
      setErrorMessage('Password reset token is missing. Please request a new reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please verify your new password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        token: tokenToUse,
        new_password: newPassword,
        confirm_password: confirmNewPassword
      });

      setResetCompletedSuccess(true);
      setLoginPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regStrength = calculatePasswordStrength(regPassword);
  const resetStrength = calculatePasswordStrength(newPassword);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-backdrop overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md my-8 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-interactive"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-900/5 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] p-1 flex items-center justify-center shadow-xs shrink-0">
            <img src="/assets/hirenova-logo.png" alt="HireNova Logo" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              HireNova
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Next-Gen Recruitment
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-toast">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-toast">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: LOGIN                                                */}
        {/* ============================================================ */}
        {currentView === 'login' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                Sign in to HireNova
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your work credentials to access your screening workspace.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Work Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot-password')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 btn-interactive"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchView('register')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1"
              >
                Create an account
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: REGISTRATION                                         */}
        {/* ============================================================ */}
        {currentView === 'register' && (
          <div>
            {accountCreatedSuccess ? (
              <div className="text-center py-4 space-y-4 animate-toast">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Account Created Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Your account has been registered with HireNova. You can now sign in with your credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm btn-interactive inline-flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                    Create your account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select your recruitment role and start screening talent faster.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="alex@company.com"
                        autoComplete="email"
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="e.g. CloudScale Technologies"
                        autoComplete="organization"
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Role Selector with Descriptions (Requirement 4) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Role *
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {ROLES.map((r) => {
                        const isSelected = regRole === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setRegRole(r.id)}
                            className={`p-2 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#121A2F]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{r.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {r.description}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword && (
                      <div className="mt-1.5 space-y-1">
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${regStrength.color}`}
                            style={{ width: regStrength.width }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Strength: <span className="font-medium text-slate-700 dark:text-slate-300">{regStrength.label}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 btn-interactive"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </form>

                {/* Back to sign in */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: FORGOT PASSWORD (Requirement 2)                      */}
        {/* ============================================================ */}
        {currentView === 'forgot-password' && (
          <div>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                Reset your password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your email and we'll send you instructions to reset your password.
              </p>
            </div>

            {forgotSubmitted ? (
              <div className="py-4 space-y-4 animate-toast">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Reset instructions dispatched</div>
                      <p className="mt-1 text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        If an account exists for <span className="font-medium">{forgotEmail}</span>, instructions to reset your password have been sent. Please check your inbox and spam folder.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Development-safe reset mechanism without fake claims (Requirement 2) */}
                {devResetToken && (
                  <div className="p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium text-indigo-900 dark:text-indigo-200 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Development Environment Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      Local SMTP is not configured. A development reset token has been verified:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setResetToken(devResetToken);
                        switchView('reset-password');
                      }}
                      className="mt-2.5 w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm btn-interactive inline-flex items-center justify-center gap-1"
                    >
                      <span>Proceed to Reset Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg shadow-sm btn-interactive"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registered Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-interactive"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: RESET PASSWORD (Requirement 3)                       */}
        {/* ============================================================ */}
        {currentView === 'reset-password' && (
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                Set new password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create a strong new password for your recruiter account.
              </p>
            </div>

            {resetCompletedSuccess ? (
              <div className="py-4 space-y-4 text-center animate-toast">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Password Reset Complete
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your password has been reset successfully.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm btn-interactive inline-flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${resetStrength.color}`}
                          style={{ width: resetStrength.width }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Strength: <span className="font-medium text-slate-700 dark:text-slate-300">{resetStrength.label}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 btn-interactive"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
