import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  getMeApi,
  clearAuthToken,
  getAuthToken
} from '../services/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'hirenova_user_profile';
const REMEMBERED_EMAIL_KEY = 'hirenova_remembered_email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('talent_ai_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot-password' | 'reset-password'
  const [resetToken, setResetToken] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check URL pathname, hash or query parameters on load to support direct deep-linking
  useEffect(() => {
    const handleUrlAuth = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase().replace('#', '').trim();
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');

        if (path === '/forgot-password' || params.get('mode') === 'forgot-password' || hash === 'forgot-password') {
          setAuthView('forgot-password');
          setIsAuthModalOpen(true);
        } else if (path === '/reset-password' || params.get('mode') === 'reset-password' || hash === 'reset-password' || tokenParam) {
          if (tokenParam) setResetToken(tokenParam);
          setAuthView('reset-password');
          setIsAuthModalOpen(true);
        } else if (path === '/register' || path === '/signup' || params.get('mode') === 'register' || params.get('mode') === 'signup' || hash === 'register' || hash === 'signup') {
          setAuthView('register');
          setIsAuthModalOpen(true);
        } else if (path === '/login' || path === '/signin' || params.get('mode') === 'login' || params.get('mode') === 'signin' || hash === 'login' || hash === 'signin') {
          setAuthView('login');
          setIsAuthModalOpen(true);
        }
      } catch {
        // Ignore URL parsing errors
      }
    };

    handleUrlAuth();
    window.addEventListener('hashchange', handleUrlAuth);
    window.addEventListener('popstate', handleUrlAuth);
    return () => {
      window.removeEventListener('hashchange', handleUrlAuth);
      window.removeEventListener('popstate', handleUrlAuth);
    };
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await getMeApi();
          setUser(profile);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid, logging out:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await loginApi({ email, password });
    setUser(res.user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));

    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    setIsAuthModalOpen(false);
    return res.user;
  };

  const register = async ({ email, password, full_name, company_name, role = 'Recruiter' }) => {
    const res = await registerApi({ email, password, full_name, company_name, role });
    // Keep user created info
    return res;
  };

  const forgotPassword = async (email) => {
    return await forgotPasswordApi({ email });
  };

  const resetPassword = async ({ token, new_password, confirm_password }) => {
    return await resetPasswordApi({ token, new_password, confirm_password });
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('talent_ai_user_profile');
    setUser(null);
  };

  const updateUserProfile = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const [pendingTab, setPendingTab] = useState(null);

  const openAuthModal = (view = 'login', email = '', requestedTab = null) => {
    setAuthView(view);
    if (email) setPrefilledEmail(email);
    if (requestedTab) setPendingTab(requestedTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingTab,
        setPendingTab,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        updateUserProfile,
        isAuthModalOpen,
        authView,
        setAuthView,
        resetToken,
        setResetToken,
        prefilledEmail,
        setPrefilledEmail,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
