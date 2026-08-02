import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) { setMessage(data.message || 'Registration failed'); return; }
      login({ ...data.user, token: data.token });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
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

        <h2>Create account</h2>
        <p className="auth-subtitle">Start your AI database journey today</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div className="input-icon-wrap">
              <User size={15} className="input-icon" />
              <input id="reg-name" className="form-input form-input-icon"
                placeholder="John Smith" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <Mail size={15} className="input-icon" />
              <input id="reg-email" type="email" className="form-input form-input-icon"
                placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={15} className="input-icon" />
              <input id="reg-password" type="password" className="form-input form-input-icon"
                placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} required />
            </div>
          </div>
          <button id="reg-submit" type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.25rem' }}
            disabled={loading}>
            {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={16} strokeWidth={2.5} /></>}
          </button>
        </form>

        {message && <p className="auth-error">{message}</p>}
        <p className="auth-divider">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
