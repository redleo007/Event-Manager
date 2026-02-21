import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import './Login.css';
import { useAuth } from '../context/AuthContext';

type LoginMode = 'login' | 'signup';
type LoginRole = 'admin' | 'user';

export function Login() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<LoginMode>('login');
  const [loginRole, setLoginRole] = useState<LoginRole>('admin');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as LoginRole,
  });

  const modeTitle = useMemo(() => {
    if (mode === 'signup') return 'Create an Account';
    return loginRole === 'admin' ? 'Admin Login' : 'User Login';
  }, [mode, loginRole]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
        mode: loginRole,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setAlert({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const result = await signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        confirmPassword: signupForm.confirmPassword,
        role: signupForm.role,
      });

      if (result.pending) {
        setAlert({ type: 'success', message: result.message });
        setMode('login');
        setLoginRole('admin');
        setSignupForm({ ...signupForm, password: '', confirmPassword: '' });
      } else {
        setAlert({ type: 'success', message: 'Account created. You are now logged in.' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-up failed. Please try again.';
      setAlert({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-brand">
              <img src="/logo.svg" alt="Eventz Logo" className="brand-icon" />
              <span className="brand-name">Eventz</span>
            </div>
            <div className="login-title-row">
              <h1>{modeTitle}</h1>
              <div className="login-tabs">
                <button
                  type="button"
                  className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('login');
                    setAlert(null);
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('signup');
                    setAlert(null);
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>
            <p>Secure access with role-based permissions</p>
          </div>

          {mode === 'login' && (
            <div className="login-role-toggle">
              <button
                type="button"
                className={`role-chip ${loginRole === 'admin' ? 'active' : ''}`}
                onClick={() => setLoginRole('admin')}
                disabled={loading}
              >
                <Icon name="lock" alt="Admin" sizePx={16} /> Admin Login
              </button>
              <button
                type="button"
                className={`role-chip ${loginRole === 'user' ? 'active' : ''}`}
                onClick={() => setLoginRole('user')}
                disabled={loading}
              >
                <Icon name="user" alt="User" sizePx={16} /> User Login
              </button>
            </div>
          )}

          {alert && (
            <div className={`alert alert-${alert.type}`}>
              <span className="alert-icon"><Icon name={alert.type === 'error' ? 'warning' : 'success'} alt="Alert" sizePx={20} /></span>
              <span className="alert-text">{alert.message}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
              <p className="helper-text">
                {loginRole === 'admin'
                  ? 'Admins manage events, imports, and settings. Use your approved admin email.'
                  : 'Users have read-only access. Use your registered user email.'}
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="login-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-confirm">Confirm Password</label>
                  <input
                    id="signup-confirm"
                    type="password"
                    placeholder="Re-enter password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Account Type</label>
                <div className="role-select">
                  <label className={`role-option ${signupForm.role === 'user' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={signupForm.role === 'user'}
                      onChange={() => setSignupForm({ ...signupForm, role: 'user' })}
                      disabled={loading}
                    />
                    <span>User (read-only)</span>
                  </label>
                  <label className={`role-option ${signupForm.role === 'admin' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={signupForm.role === 'admin'}
                      onChange={() => setSignupForm({ ...signupForm, role: 'admin' })}
                      disabled={loading}
                    />
                    <span>Admin (requires approval)</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
              <p className="helper-text">
                Admin sign-ups start as pending and must be approved by an existing admin. Users are approved automatically with read-only access.
              </p>
            </form>
          )}
        </div>

        <div className="login-background">
          <div className="bg-element bg-1"></div>
          <div className="bg-element bg-2"></div>
          <div className="bg-element bg-3"></div>
        </div>
      </div>
    </div>
  );
}
