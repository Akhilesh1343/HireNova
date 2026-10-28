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
  ChevronLeft,
  Sparkles,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOAuthUrlApi } from '../../services/api';

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.36-.57.66-1.07 1.72-.94 2.75 1.01.08 2.04-.51 2.66-1.26z" />
    </svg>
  );
}

const ROLES = [
  {
    id: 'Recruiter',
    title: 'Recruiter',
    description: 'Manage candidates, screen resumes and evaluate skills.'
  },
  {
    id: 'Hiring Manager',
    title: 'Hiring Manager',
    description: 'Review shortlisted candidates and conduct interviews.'
  },
  {
    id: 'HR Lead',
    title: 'HR Lead',
    description: 'Monitor recruitment metrics and team performance.'
  }
];

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-700', width: '0%' };
  let points = 0;
  if (pass.length >= 8) points += 1;
  if (pass.length >= 12) points += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) points += 1;
  if (/[0-9]/.test(pass)) points += 1;
  if (/[^A-Za-z0-9]/.test(pass)) points += 1;

  if (points <= 2) {
    return { score: 1, label: 'Weak (min 8 chars, mix letters/numbers)', color: 'bg-red-500', width: '33%' };
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
    resetPassword,
    verifyResetToken
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

  // Reset password state & token verification
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetCompletedSuccess, setResetCompletedSuccess] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenEmail, setTokenEmail] = useState('');

  // Social OAuth state
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | null
  const [oauthNotice, setOauthNotice] = useState(null);

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
      setOauthNotice(null);
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

  // Token verification effect for reset-password view
  useEffect(() => {
    if (currentView === 'reset-password' && isAuthModalOpen) {
      if (!resetToken) {
        setTokenError('Password reset token is missing. Please use the secure link sent to your email.');
        setTokenVerified(false);
        return;
      }

      let isMounted = true;
      setIsVerifyingToken(true);
      setTokenError('');

      if (verifyResetToken) {
        verifyResetToken(resetToken)
          .then((res) => {
            if (isMounted) {
              setTokenVerified(true);
              setTokenEmail(res?.email || '');
              setTokenError('');
            }
          })
          .catch((err) => {
            if (isMounted) {
              setTokenVerified(false);
              setTokenError(err.message || 'This password reset link is invalid or has expired. Please request a new one.');
            }
          })
          .finally(() => {
            if (isMounted) {
              setIsVerifyingToken(false);
            }
          });
      }

      return () => {
        isMounted = false;
      };
    }
  }, [currentView, isAuthModalOpen, resetToken, verifyResetToken]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    closeAuthModal();
    try {
      if (window.location.hash === '#login' || window.location.hash === '#signup' || window.location.hash === '#register') {
        window.history.pushState(null, '', window.location.pathname);
      }
    } catch {
      // Ignore history state errors
    }
  };

  const switchView = (newView) => {
    setErrorMessage('');
    setSuccessMessage('');
    setOauthNotice(null);
    setAccountCreatedSuccess(false);
    setForgotSubmitted(false);
    setResetCompletedSuccess(false);
    setTokenError('');
    setCurrentView(newView);
    setAuthView(newView);
  };

  // -------------------------------------------------------------
  // SOCIAL OAUTH HANDLER (Google & Apple)
  // -------------------------------------------------------------
  const handleSocialAuth = async (provider) => {
    setErrorMessage('');
    setSuccessMessage('');
    setOauthNotice(null);
    setSocialLoading(provider);

    try {
      const res = await getOAuthUrlApi(provider);
      if (res && res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err) {
      const providerName = provider === 'google' ? 'Google' : 'Apple';
      const configVars = provider === 'google'
        ? 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
        : 'APPLE_CLIENT_ID and APPLE_TEAM_ID';
      setOauthNotice({
        provider: providerName,
        message: err.message || `${providerName} Sign-In is not configured yet. To enable real ${providerName} authentication, configure ${configVars} in backend/.env.`
      });
    } finally {
      setSocialLoading(null);
    }
  };

  // -------------------------------------------------------------
  // 1. LOGIN HANDLER
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setOauthNotice(null);

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resUser = await login(cleanEmail, loginPassword, rememberMe);
      if (onLoginSuccess) {
        onLoginSuccess(resUser);
      }
      handleClose();
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
    setOauthNotice(null);

    const cleanName = regFullName.trim();
    const cleanEmail = regEmail.trim();
    const cleanCompany = regCompany.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!cleanCompany) {
      setErrorMessage('Please enter your company or organization name.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password entries.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: cleanEmail,
        password: regPassword,
        full_name: cleanName,
        company_name: cleanCompany,
        role: regRole
      });

      setAccountCreatedSuccess(true);
      setLoginEmail(cleanEmail);
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'Could not complete registration. Please check details and try again.');
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
    setOauthNotice(null);

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
      await forgotPassword(cleanEmail);
      setForgotSubmitted(true);
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
    setOauthNotice(null);

    if (!resetToken) {
      setErrorMessage('Password reset token is missing. Please use the secure link sent to your email.');
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
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmNewPassword
      });

      setResetCompletedSuccess(true);
      setLoginPassword('');

      // Clean up reset token parameter from browser URL without page reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('reset_token');
        const cleanHash = window.location.hash.includes('reset') ? '' : window.location.hash;
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + cleanHash);
      } catch {
        // Ignore history replace state errors
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not reset password. The link or token may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regStrength = calculatePasswordStrength(regPassword);
  const resetStrength = calculatePasswordStrength(newPassword);

  const isTabbedView = currentView === 'login' || currentView === 'register';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-slate-950/85 backdrop-blur-xl animate-backdrop overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Split-screen Modal Container */}
      <div
        className="w-full max-w-5xl xl:max-w-[1100px] my-auto min-h-[560px] lg:h-[660px] xl:h-[700px] max-h-[94vh] bg-[#0B1210] border border-emerald-500/20 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_50px_rgba(5,150,105,0.18)] flex flex-col lg:flex-row overflow-hidden relative animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            LEFT PANEL: BRAND EXPERIENCE (Desktop Only: lg+)
            Emerald Obsidian Dark Theme coordinates with HireNova branding
            ========================================================================= */}
        <div className="hidden lg:flex lg:w-1/2 p-8 xl:p-10 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0B1210] via-[#0E1A16] to-[#050807] border-r border-emerald-500/15 select-none">
          
          {/* Atmospheric ambient glows */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-600/15 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-teal-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#059669]/15 blur-[80px] pointer-events-none animate-atmospheric-pulse" />
          <div className="absolute inset-0 bg-subtle-grid opacity-20 pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1210] border border-emerald-500/25 p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0 backdrop-blur-md">
              <img
                src="/assets/hirenova-logo.png"
                alt="HireNova Brand Mark"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                HireNova
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block animate-pulse" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400/80 tracking-wider uppercase">
                Next-Gen Recruitment
              </span>
            </div>
          </div>

          {/* Center 3D Logo Showcase Card */}
          <div className="relative z-10 my-auto py-2 flex flex-col items-center text-center">
            {/* Soft glowing aura behind the logo */}
            <div className="relative flex items-center justify-center w-36 h-36 xl:w-40 xl:h-40">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-500/25 to-emerald-400/20 blur-2xl animate-atmospheric-pulse pointer-events-none" />
              
              {/* 3D Rotating Logo */}
              <div className="relative z-10 w-28 h-28 xl:w-32 xl:h-32 flex items-center justify-center animate-h-logo-3d">
                <img
                  src="/assets/hirenova-logo.png"
                  alt="HireNova 3D Teal Logo"
                  className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(52,211,153,0.35)]"
                  draggable={false}
                />
              </div>
            </div>
            
            {/* Subtle perspective shadow below 3D logo */}
            <div className="w-24 h-3.5 rounded-full bg-black/60 blur-md mx-auto -mt-1 scale-y-50" />

            {/* Headline & Supporting Text */}
            <h2 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight mt-6 leading-tight">
              Hire Smarter.{' '}
              <span className="bg-gradient-to-r from-[#A7F3D0] via-[#34D399] to-teal-300 bg-clip-text text-transparent">
                Find the Right Talent.
              </span>
            </h2>
            <p className="text-xs text-slate-300/80 mt-2.5 max-w-sm leading-relaxed mx-auto">
              AI-powered resume screening and candidate shortlisting, designed to help your team make better hiring decisions.
            </p>
          </div>

          {/* Three Compact Feature Highlights */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-4 border-t border-emerald-500/15">
            {/* Feature 1 */}
            <div className="p-2.5 rounded-xl bg-[#131F1B]/70 border border-emerald-500/15 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[#34D399] flex items-center justify-center mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-[11px] text-white leading-tight">
                AI Resume Screening
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Instant semantic extraction
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-2.5 rounded-xl bg-[#131F1B]/70 border border-emerald-500/15 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center mb-1.5">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-[11px] text-white leading-tight">
                Candidate Matching
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Multi-metric ATS scoring
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-2.5 rounded-xl bg-[#131F1B]/70 border border-emerald-500/15 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mb-1.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-[11px] text-white leading-tight">
                Fast Shortlisting
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Automated rankings
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: AUTHENTICATION FORMS (All Screen Sizes)
            Clean, modern, obsidian-dark recruitment card
            ========================================================================= */}
        <div className="w-full lg:w-1/2 p-5 sm:p-7 xl:p-9 flex flex-col justify-between relative overflow-y-auto bg-[#0B1210] text-[#F8FAFC]">
          
          {/* Top Bar: Mobile Brand + Tab Navigation + Close Button */}
          <div>
            <div className="flex items-center justify-between mb-4">
              
              {/* Mobile-Only Brand Header (< 1024px) */}
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-[#0B1210] border border-emerald-500/25 p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/hirenova-logo.png"
                    alt="HireNova Logo"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-sm text-white flex items-center gap-1">
                    HireNova
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block" />
                  </span>
                  <span className="text-[10px] text-emerald-400/80">Next-Gen Recruitment</span>
                </div>
              </div>

              {/* Login / Sign Up Tab Switcher */}
              {isTabbedView && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-xs">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                      currentView === 'login'
                        ? 'bg-[#059669] text-white shadow-sm'
                        : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#182A24]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                      currentView === 'register'
                        ? 'bg-[#059669] text-white shadow-sm'
                        : 'text-[#94A3A8] hover:text-[#F8FAFC] hover:bg-[#182A24]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Back to Sign In Link (when in Forgot Password or Reset Password) */}
              {!isTabbedView && (
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              )}

              {/* Close Modal Button */}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors ml-auto"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-toast">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Alert Banner */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-toast">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* OAuth Notice Banner */}
            {oauthNotice && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-start gap-2.5 animate-toast">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold block text-amber-300 mb-0.5">
                    {oauthNotice.provider} Authentication Setup Required
                  </span>
                  <span>{oauthNotice.message}</span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 1: LOGIN                                                */}
            {/* ============================================================ */}
            {currentView === 'login' && (
              <div className="animate-fadeIn">
                <div className="mb-5">
                  <h3 id="auth-modal-title" className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                    Welcome back
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in to continue to your recruitment workspace.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Work Email Field */}
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@company.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 rounded-xl auth-input focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchView('forgot-password')}
                        className="text-xs text-[#34D399] hover:text-[#A7F3D0] hover:underline font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 rounded-xl auth-input focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/[0.15] bg-white/[0.05] text-[#059669] focus:ring-[#059669] focus:ring-offset-0"
                      />
                      <span>Remember Me</span>
                    </label>
                  </div>

                  {/* Primary Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 sm:py-3 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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

                {/* Social Auth Section: Google & Apple */}
                <div className="mt-4 space-y-3">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-emerald-500/15" />
                    </div>
                    <div className="relative px-3 bg-[#0B1210] text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      OR CONTINUE WITH
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={socialLoading !== null || isSubmitting}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#131F1B] hover:bg-[#182A24] border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
                      aria-label="Continue with Google"
                    >
                      {socialLoading === 'google' ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <GoogleIcon className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">Continue with Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialAuth('apple')}
                      disabled={socialLoading !== null || isSubmitting}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#131F1B] hover:bg-[#182A24] border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
                      aria-label="Continue with Apple"
                    >
                      {socialLoading === 'apple' ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <AppleIcon className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">Continue with Apple</span>
                    </button>
                  </div>
                </div>

                {/* Divider & Switch to Register */}
                <div className="mt-5 pt-3.5 border-t border-emerald-500/15 text-center text-xs text-slate-400">
                  New to HireNova?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-[#34D399] hover:text-[#A7F3D0] font-semibold hover:underline ml-1"
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
              <div className="animate-fadeIn">
                {accountCreatedSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-toast">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">
                        Account Created Successfully!
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Your account has been registered with HireNova. You can now sign in with your credentials.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Continue to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h3 id="auth-modal-title" className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                        Create your account
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Get started with smarter recruitment.
                      </p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-3">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="reg-name" className="block text-xs font-medium text-slate-300 mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            id="reg-name"
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g. Alex Morgan"
                            autoComplete="name"
                            className="w-full pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 rounded-lg auth-input focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Work Email */}
                      <div>
                        <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300 mb-1">
                          Work Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            id="reg-email"
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="alex@company.com"
                            autoComplete="email"
                            className="w-full pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 rounded-lg auth-input focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label htmlFor="reg-company" className="block text-xs font-medium text-slate-300 mb-1">
                          Company Name *
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            id="reg-company"
                            type="text"
                            required
                            value={regCompany}
                            onChange={(e) => setRegCompany(e.target.value)}
                            placeholder="e.g. CloudScale Technologies"
                            autoComplete="organization"
                            className="w-full pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 rounded-lg auth-input focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Role Selector with Descriptions (Admin Excluded!) */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Role *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {ROLES.map((r) => {
                            const isSelected = regRole === r.id;
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setRegRole(r.id)}
                                className={`p-2 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? 'border-[#059669] bg-emerald-950/40 text-white'
                                    : 'border-emerald-500/15 hover:border-emerald-500/30 bg-[#131F1B] text-[#94A3A8]'
                                }`}
                              >
                                <div className="font-semibold text-[11px] text-white truncate">
                                  {r.title}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                                  {r.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300 mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            id="reg-password"
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className="w-full pl-9 pr-10 py-2 text-xs text-white placeholder:text-slate-500 rounded-lg auth-input focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            title={showRegPassword ? 'Hide password' : 'Show password'}
                            aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {regPassword && (
                          <div className="mt-1.5 space-y-1">
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${regStrength.color}`}
                                style={{ width: regStrength.width }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Strength: <span className="font-medium text-slate-300">{regStrength.label}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-slate-300 mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            id="reg-confirm-password"
                            type={showRegConfirmPassword ? 'text' : 'password'}
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                            className="w-full pl-9 pr-10 py-2 text-xs text-white placeholder:text-slate-500 rounded-lg auth-input focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
                        className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
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

                    {/* Social Auth Section: Google & Apple */}
                    <div className="mt-3.5 space-y-2.5">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-emerald-500/15" />
                        </div>
                        <div className="relative px-3 bg-[#0B1210] text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                          OR CONTINUE WITH
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSocialAuth('google')}
                          disabled={socialLoading !== null || isSubmitting}
                          className="w-full py-2 px-3 rounded-xl bg-[#131F1B] hover:bg-[#182A24] border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
                          aria-label="Continue with Google"
                        >
                          {socialLoading === 'google' ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <GoogleIcon className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate">Continue with Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSocialAuth('apple')}
                          disabled={socialLoading !== null || isSubmitting}
                          className="w-full py-2 px-3 rounded-xl bg-[#131F1B] hover:bg-[#182A24] border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
                          aria-label="Continue with Apple"
                        >
                          {socialLoading === 'apple' ? (
                            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <AppleIcon className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate">Continue with Apple</span>
                        </button>
                      </div>
                    </div>

                    {/* Back to sign in */}
                    <div className="mt-4 pt-3 border-t border-emerald-500/15 text-center text-xs text-slate-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="text-[#34D399] hover:text-[#A7F3D0] font-semibold hover:underline ml-1"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: FORGOT PASSWORD                                      */}
            {/* ============================================================ */}
            {currentView === 'forgot-password' && (
              <div className="animate-fadeIn">
                <div className="mb-4">
                  <h3 id="auth-modal-title" className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                    Reset your password
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your email and we'll send you instructions to reset your password.
                  </p>
                </div>

                {forgotSubmitted ? (
                  <div className="py-4 space-y-4 animate-toast">
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs space-y-2">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm text-emerald-200">Reset instructions dispatched</div>
                          <p className="mt-1 text-emerald-300/90 leading-relaxed text-xs">
                            If an account exists for <span className="font-medium text-white">{forgotEmail}</span>, instructions to reset your password have been processed.
                          </p>
                          <p className="mt-2 text-slate-300 text-[11px] leading-relaxed">
                            Please check your email inbox and click the secure password reset link. The link expires in 20 minutes and can only be used once.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Return to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Registered Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="name@company.com"
                          autoComplete="email"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 rounded-xl auth-input focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 sm:py-3 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
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
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel and return to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 4: RESET PASSWORD                                       */}
            {/* ============================================================ */}
            {currentView === 'reset-password' && (
              <div className="animate-fadeIn">
                <div className="mb-4">
                  <h3 id="auth-modal-title" className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                    Set new password
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {tokenEmail
                      ? `Create a strong new password for ${tokenEmail}.`
                      : 'Create a strong new password for your recruiter account.'}
                  </p>
                </div>

                {resetCompletedSuccess ? (
                  <div className="py-6 space-y-4 text-center animate-toast">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">
                        Password Reset Complete
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Your password has been reset successfully. You can now sign in with your new password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Continue to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isVerifyingToken ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">
                      Verifying secure reset link...
                    </p>
                  </div>
                ) : tokenError || !resetToken ? (
                  <div className="py-4 space-y-4">
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <div className="font-semibold text-red-200">Invalid or Expired Reset Link</div>
                        <p className="mt-1 text-red-300/90 text-xs">
                          {tokenError || 'This password reset link is invalid, has expired, or has already been used.'}
                        </p>
                        <p className="mt-1.5 text-slate-400 text-[11px]">
                          For security, password reset links expire after 20 minutes and can only be used once. Please request a new link.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchView('forgot-password')}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Request a New Reset Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel and return to Sign In
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                        New Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 rounded-xl auth-input focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${resetStrength.color}`}
                              style={{ width: resetStrength.width }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Strength: <span className="font-medium text-slate-300">{resetStrength.label}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="confirm-new-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          id="confirm-new-password"
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 rounded-xl auth-input focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
                      className="w-full py-2.5 sm:py-3 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel and return to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Bottom Security Note */}
          <div className="pt-4 mt-6 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#34D399]" />
              <span>256-bit SSL encrypted</span>
            </span>
            <span>HireNova © 2026</span>
          </div>

        </div>
      </div>
    </div>
  );
}
