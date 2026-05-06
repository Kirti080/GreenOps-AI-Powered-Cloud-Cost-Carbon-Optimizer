import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Github, Chrome, CheckCircle2, Leaf,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'register');
  }, [searchParams]);

  // ── OAuth Handlers ───────────────────────────────────────────────────────────
  const handleGitHubLogin = async () => {
    setOauthLoading('github');
    // Simulate auth process (2s delay for better UX)
    await new Promise(r => setTimeout(r, 2000));
    window.location.href = `${API_URL}/auth/github`;
  };

  const handleGoogleLogin = async () => {
    setOauthLoading('google');
    // Simulate auth process (2s delay for better UX)
    await new Promise(r => setTimeout(r, 2000));
    window.location.href = `${API_URL}/auth/google`;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isLogin && !formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email address';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Must be at least 8 characters';
    if (!isLogin && formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // simulate auth delay then navigate to dashboard
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    navigate('/dashboard');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    navigate(`/auth?mode=${isLogin ? 'register' : 'login'}`, { replace: true });
  };

  const strengthScore = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = strengthScore(formData.password);
  const strengthColors = ['#ef4444', '#f59e0b', '#06b6d4', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
        <div className="auth-bg-grid" />
      </div>

      {/* Left Panel — branding */}
      <div className="auth-left">
        <motion.div
          className="auth-left-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="landing-logo" onClick={() => navigate('/landing')} style={{ cursor: 'pointer', marginBottom: '2rem' }}>
            <div className="landing-logo-icon">
              <Globe size={20} color="white" />
            </div>
            <span className="landing-logo-text" style={{ fontSize: '1.4rem' }}>
              Green<span style={{ color: 'var(--green)' }}>Ops</span>
            </span>
          </div>

          <h1 className="auth-left-title">
            Build a Greener<br />
            <span className="text-gradient">Cloud Future</span>
          </h1>
          <p className="auth-left-desc">
            Monitor, predict, and optimize your cloud infrastructure's environmental impact with AI-powered insights.
          </p>

          <div className="auth-left-features">
            {[
              'Real-time carbon footprint tracking',
              'AI-powered traffic forecasting',
              'Smart resource optimization',
              'Comprehensive sustainability reports',
            ].map((f, i) => (
              <motion.div
                key={i}
                className="auth-left-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <CheckCircle2 size={16} color="var(--green)" />
                <span>{f}</span>
              </motion.div>
            ))}
          </div>

          <div className="auth-left-metric">
            <Leaf size={20} color="var(--green)" />
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-l)' }}>18+ Tons</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>CO₂ saved by our users this year</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel — form */}
      <div className="auth-right">
        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="auth-form-title">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="auth-form-subtitle">
                {isLogin
                  ? 'Sign in to access your sustainability dashboard'
                  : 'Start your 14-day free trial — no credit card required'}
              </p>

              {/* Social Buttons */}
              <div className="auth-social-buttons">
                <button 
                  className="auth-social-btn" 
                  type="button"
                  onClick={handleGitHubLogin}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === 'github' ? (
                    <>
                      <span className="auth-spinner" style={{ marginRight: '8px' }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Github size={18} /> GitHub
                    </>
                  )}
                </button>
                <button 
                  className="auth-social-btn" 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === 'google' ? (
                    <>
                      <span className="auth-spinner" style={{ marginRight: '8px' }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Chrome size={18} /> Google
                    </>
                  )}
                </button>
              </div>

              <div className="auth-divider">
                <span>or continue with email</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <div className="auth-field">
                    <label htmlFor="auth-name">Full Name</label>
                    <div className={`auth-input-wrap ${errors.name ? 'auth-input-error' : ''}`}>
                      <User size={16} className="auth-input-icon" />
                      <input
                        id="auth-name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    {errors.name && <span className="auth-error">{errors.name}</span>}
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-email">Email</label>
                  <div className={`auth-input-wrap ${errors.email ? 'auth-input-error' : ''}`}>
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <span className="auth-error">{errors.email}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password">Password</label>
                  <div className={`auth-input-wrap ${errors.password ? 'auth-input-error' : ''}`}>
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="auth-toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="auth-error">{errors.password}</span>}

                  {/* Password strength meter */}
                  {!isLogin && formData.password && (
                    <div className="auth-pw-strength">
                      <div className="auth-pw-bars">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className="auth-pw-bar"
                            style={{
                              background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      {strength > 0 && (
                        <span style={{ color: strengthColors[strength - 1], fontSize: '0.7rem', fontWeight: 600 }}>
                          {strengthLabels[strength - 1]}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="auth-field">
                    <label htmlFor="auth-confirm-password">Confirm Password</label>
                    <div className={`auth-input-wrap ${errors.confirmPassword ? 'auth-input-error' : ''}`}>
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        id="auth-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </div>
                    {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
                  </div>
                )}

                {isLogin && (
                  <div className="auth-extras">
                    <label className="auth-checkbox-label">
                      <input type="checkbox" className="auth-checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="auth-forgot">Forgot password?</a>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button type="button" onClick={toggleMode}>
                  {isLogin ? 'Sign up for free' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {oauthLoading && (
          <motion.div
            className="auth-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="auth-loading-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="auth-loading-spinner" />
              <h2 className="auth-loading-text">
                Connecting with {oauthLoading === 'github' ? 'GitHub' : 'Google'}...
              </h2>
              <p className="auth-loading-subtext">Redirecting you to login</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
