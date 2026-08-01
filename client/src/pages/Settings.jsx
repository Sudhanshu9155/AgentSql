import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/api';
import {
  User, Mail, Shield, Server, Cpu, Save,
  CheckCircle2, Lock, Eye, EyeOff, Pencil, KeyRound,
} from 'lucide-react';

export default function Settings() {
  const { user, login: setUser } = useAuth();

  // ── Edit Profile ──
  const [profile, setProfile]       = useState({ name: user?.name || '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Change Password ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwMsg, setPwMsg]   = useState({ text: '', type: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // ── AI Settings ──
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [model, setModel]         = useState('codellama');
  const [aiSaved, setAiSaved]     = useState(false);

  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileLoading(true); setProfileMsg({ text: '', type: '' });
    try {
      const data = await request('/auth/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profile.name }),
      });
      const stored  = JSON.parse(localStorage.getItem('agentsql-user') || '{}');
      setUser({ ...stored, ...data.user });
      setProfileMsg({ text: data.message || 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.message || 'Update failed', type: 'error' });
    } finally { setProfileLoading(false); }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'New passwords do not match', type: 'error' }); return;
    }
    setPwLoading(true); setPwMsg({ text: '', type: '' });
    try {
      const data = await request('/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      setPwMsg({ text: data.message || 'Password changed!', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ text: err.message || 'Failed to change password', type: 'error' });
    } finally { setPwLoading(false); }
  }

  function handleAiSave(e) {
    e.preventDefault();
    localStorage.setItem('agentsql-settings', JSON.stringify({ ollamaUrl, model }));
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  }

  function togglePw(field) {
    setShowPw(p => ({ ...p, [field]: !p[field] }));
  }

  const pwEyeBtn = (field) => (
    <button
      type="button"
      onClick={() => togglePw(field)}
      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
    >
      {showPw[field] ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
    </button>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your profile, security, and AI workspace preferences</p>
      </div>

      {/* ── Account Overview ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={16} color="var(--teal)" strokeWidth={2} /> Account
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--orange), var(--orange-deep))',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: '1.2rem',
            fontWeight: 700, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.name || '—'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={12} strokeWidth={2} /> {user?.email}
            </div>
            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} strokeWidth={2} color="var(--orange)" />
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{user?.role || 'user'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={16} color="var(--teal)" strokeWidth={2} /> Edit Profile
          </span>
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="settings-name"
              className="form-input"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          {/* Email — read-only display */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{
              padding: '0.65rem 0.9rem',
              border: '1.5px solid var(--border)',
              borderRadius: '9px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Mail size={14} strokeWidth={2} />
              {user?.email}
            </div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <button id="settings-profile-save" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }} disabled={profileLoading}>
              <Save size={15} strokeWidth={2} />
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>

        {profileMsg.text && (
          <div className={`badge badge-${profileMsg.type}`}
            style={{ padding: '0.65rem 1rem', borderRadius: '8px', width: '100%', marginTop: '0.75rem', fontSize: '0.85rem', display: 'block' }}>
            {profileMsg.text}
          </div>
        )}
      </div>

      {/* ── Change Password ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <KeyRound size={16} color="var(--teal)" strokeWidth={2} /> Change Password
          </span>
        </div>

        <form onSubmit={handlePasswordSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Current password — full row */}
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="settings-current-pw"
                type={showPw.current ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your current password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              {pwEyeBtn('current')}
            </div>
          </div>

          {/* New + Confirm side by side */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="settings-new-pw"
                type={showPw.newPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              {pwEyeBtn('newPw')}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="settings-confirm-pw"
                type={showPw.confirm ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              {pwEyeBtn('confirm')}
            </div>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <button id="settings-pw-save" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }} disabled={pwLoading}>
              <Lock size={15} strokeWidth={2} />
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>

        {pwMsg.text && (
          <div className={`badge badge-${pwMsg.type}`}
            style={{ padding: '0.65rem 1rem', borderRadius: '8px', width: '100%', marginTop: '0.75rem', fontSize: '0.85rem', display: 'block' }}>
            {pwMsg.text}
          </div>
        )}
      </div>

      {/* ── AI Configuration ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={16} color="var(--teal)" strokeWidth={2} /> AI Configuration
          </span>
        </div>
        <form onSubmit={handleAiSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Ollama URL</label>
            <input id="settings-ollama-url" className="form-input"
              value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434" />
          </div>
          <div className="form-group">
            <label className="form-label">LLM Model</label>
            <select id="settings-model" className="form-select"
              value={model} onChange={e => setModel(e.target.value)}>
              <option value="codellama">codellama (recommended)</option>
              <option value="llama3.2">llama3.2</option>
              <option value="mistral">mistral</option>
              <option value="deepseek-coder">deepseek-coder</option>
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <button id="settings-ai-save" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}>
              {aiSaved
                ? <><CheckCircle2 size={15} strokeWidth={2.5} /> Saved!</>
                : <><Save size={15} strokeWidth={2.5} /> Save AI Settings</>}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
