import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!isLogin && (!name.trim() || name.trim().length < 2)) {
      errs.name = 'Name must be at least 2 characters.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (!isLogin && password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (!isLogin && !/[A-Z]/.test(password)) {
      errs.password = 'Password must contain at least one uppercase letter.';
    } else if (!isLogin && !/[0-9]/.test(password)) {
      errs.password = 'Password must contain at least one number.';
    }
    if (!isLogin && password !== confirm) {
      errs.confirm = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const result = await login(name, email, password);
        if (!result.success) {
          setErrors({ general: result.error || 'Login failed. Please try again.' });
          return;
        }
      } else {
        const result = await register(name, email, password);
        if (!result.success) {
          setErrors({ general: result.error || 'Registration failed. Please try again.' });
          return;
        }
        setSuccess('Account created! Redirecting...');
      }
      setTimeout(() => navigate('/', { replace: true }), 300);
    } catch (err) {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setSuccess('');
    setPassword('');
    setConfirm('');
  };

  const fieldClass = (error?: string) =>
    `input-field pl-12 pr-4 ${error ? 'ring-2 ring-red-400' : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-[#0a0a0c] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-card rounded-[2rem] p-8 sm:p-10">

          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 bg-[#6c47ff] rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-[#6c47ff]/25">
              <Sparkles size={28} className="text-white" aria-hidden="true" />
            </div>
            <h1 className="font-display text-3xl font-800 text-slate-900 dark:text-white">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
              {isLogin
                ? 'Sign in to continue your learning journey'
                : 'Join SmartSight AI and start exploring the world'}
            </p>
          </div>

          {/* General error */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="error-box flex items-start gap-2 mb-4"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errors.general}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm mb-4"
                role="status"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label={isLogin ? 'Sign in form' : 'Sign up form'}>
            {/* Name (register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="name" className="sr-only">Full name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Full Name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={fieldClass(errors.name)}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </div>
                  {errors.name && <p id="name-error" className="text-red-500 text-xs mt-1 ml-2" role="alert">{errors.name}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  autoComplete={isLogin ? 'email' : 'username'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass(errors.email)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1 ml-2" role="alert">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass(errors.password)} pr-12`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'pwd-error' : (!isLogin ? 'pwd-hint' : undefined)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="pwd-error" className="text-red-500 text-xs mt-1 ml-2" role="alert">{errors.password}</p>}
              {!isLogin && !errors.password && (
                <p id="pwd-hint" className="text-slate-400 text-xs mt-1 ml-2">
                  Min. 8 chars, one uppercase letter & one number
                </p>
              )}
            </div>

            {/* Confirm password (register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="confirm" className="sr-only">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                    <input
                      id="confirm"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={fieldClass(errors.confirm)}
                      aria-invalid={!!errors.confirm}
                      aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                    />
                  </div>
                  {errors.confirm && <p id="confirm-error" className="text-red-500 text-xs mt-1 ml-2" role="alert">{errors.confirm}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-[#6c47ff] font-semibold hover:underline focus:outline-none focus-visible:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
