import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.message || 'Login failed'); return; }
      login({ ...data.user, token: data.token });
      navigate('/dashboard');
    } catch {
      setMessage('Network error. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Database size={22} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h1>AgentSQL</h1>
            <p>AI Database Studio</p>
          </div>
        </div>

        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to your workspace to continue</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <Mail size={15} className="input-icon" />
              <input id="login-email" type="email" className="form-input form-input-icon"
                placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={15} className="input-icon" />
              <input id="login-password" type="password" className="form-input form-input-icon"
                placeholder="Enter your password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.25rem' }}
            disabled={loading}>
            {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight size={16} strokeWidth={2.5} /></>}
          </button>
        </form>

        {message && <p className="auth-error">{message}</p>}
        <p className="auth-divider">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
