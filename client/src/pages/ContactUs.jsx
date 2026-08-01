import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import {
  Mail, MessageSquare, User, Send,
  CheckCircle, AlertCircle, Phone, MapPin, Clock,
  Sparkles, ArrowRight, HeartHandshake,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧  EMAILJS CONFIGURATION — replace these three values with your own.
//     Guide: https://www.emailjs.com/docs/sdk/send-form/
// ─────────────────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

const TOPICS = [
  'General Inquiry',
  'Technical Support',
  'Privacy / Data Request',
  'Bug Report',
  'Feature Request',
  'Other',
];

const CHANNELS = [
  {
    Icon: Mail,
    label: 'Email Us',
    value: 'support@agentsql.ai',
    sub: 'We reply within 24 hours',
    color: '#3457D5',
    soft: 'rgba(52,87,213,0.10)',
  },
  {
    Icon: Phone,
    label: 'Call Us',
    value: '+1 (800) 555-0198',
    sub: 'Mon – Fri, 9 AM – 6 PM EST',
    color: '#10B981',
    soft: 'rgba(16,185,129,0.10)',
  },
  {
    Icon: MapPin,
    label: 'Visit Us',
    value: 'San Francisco, CA',
    sub: 'United States',
    color: '#8B5CF6',
    soft: 'rgba(139,92,246,0.10)',
  },
  {
    Icon: Clock,
    label: 'Support Hours',
    value: 'Mon – Fri',
    sub: '9:00 AM – 6:00 PM EST',
    color: '#FFB020',
    soft: 'rgba(255,176,32,0.12)',
  },
];

export default function ContactUs() {
  const formRef = useRef(null);
  const [errors, setErrors]     = useState({});
  const [status, setStatus]     = useState(null);
  const [charCount, setCharCount] = useState(0);

  function validate(data) {
    const e = {};
    if (!data.from_name.trim())  e.from_name  = 'Full name is required.';
    if (!data.from_email.trim()) e.from_email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(data.from_email)) e.from_email = 'Please enter a valid email.';
    if (!data.topic)             e.topic      = 'Please select a topic.';
    if (!data.message.trim())    e.message    = 'Message cannot be empty.';
    else if (data.message.trim().length < 20) e.message = 'Please write at least 20 characters.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    const data = {
      from_name:  form.from_name.value,
      from_email: form.from_email.value,
      topic:      form.topic.value,
      message:    form.message.value,
    };
    const errs = validate(data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus('sending');
    try {
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form, EMAILJS_PUBLIC_KEY);
      setStatus('success');
      form.reset();
      setCharCount(0);
    } catch (err) {
      console.error('EmailJS error:', err);
      setStatus('error');
    }
  }

  function clearError(field) {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function handleReset() {
    setStatus(null);
    setErrors({});
    setCharCount(0);
    formRef.current?.reset();
  }

  return (
    <div className="cu-root">

      {/* ══ Hero Banner ════════════════════════════════════════════ */}
      <div className="cu-hero">
        <div className="cu-hero-orb cu-orb-1" />
        <div className="cu-hero-orb cu-orb-2" />
        <div className="cu-hero-inner">
          <div className="cu-hero-badge">
            <HeartHandshake size={13} strokeWidth={2.5} />
            We're Here to Help
          </div>
          <h1 className="cu-hero-title">Get in Touch</h1>
          <p className="cu-hero-desc">
            Have a question, spotted a bug, or just want to say hello?
            Our team reads every message and gets back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* ══ Channel Cards ══════════════════════════════════════════ */}
      <div className="cu-channels">
        {CHANNELS.map(({ Icon, label, value, sub, color, soft }) => (
          <div key={label} className="cu-channel-card" style={{ '--ch-color': color, '--ch-soft': soft }}>
            <div className="cu-channel-icon">
              <Icon size={20} strokeWidth={1.8} color={color} />
            </div>
            <p className="cu-channel-label">{label}</p>
            <p className="cu-channel-value">{value}</p>
            <p className="cu-channel-sub">{sub}</p>
          </div>
        ))}
      </div>

      {/* ══ Body: Form + Side Panel ════════════════════════════════ */}
      <div className="cu-body">

        {/* ── Left: Form ── */}
        <div className="cu-form-panel">
          {status === 'success' ? (
            <div className="cu-success">
              <div className="cu-success-ring">
                <CheckCircle size={44} strokeWidth={1.5} color="var(--royal-blue)" />
              </div>
              <h2>Message Sent! 🎉</h2>
              <p>Thanks for reaching out. We've received your message and will reply within <strong>24 hours</strong>.</p>
              <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: '1.5rem' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form id="contact-form" ref={formRef} onSubmit={handleSubmit} noValidate className="cu-form">
              <div className="cu-form-header">
                <div className="cu-form-header-icon">
                  <MessageSquare size={18} strokeWidth={2} color="var(--royal-blue)" />
                </div>
                <div>
                  <h2>Send a Message</h2>
                  <p>Fill in the form below and we'll get back to you shortly.</p>
                </div>
              </div>

              {/* Row: Name + Email */}
              <div className="cu-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Full Name</label>
                  <div className="input-icon-wrap">
                    <User size={15} className="input-icon" />
                    <input id="contact-name" name="from_name" type="text"
                      className={`form-input form-input-icon${errors.from_name ? ' input-error' : ''}`}
                      placeholder="Jane Doe"
                      onChange={() => clearError('from_name')} />
                  </div>
                  {errors.from_name && <p className="field-error">{errors.from_name}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">Email Address</label>
                  <div className="input-icon-wrap">
                    <Mail size={15} className="input-icon" />
                    <input id="contact-email" name="from_email" type="email"
                      className={`form-input form-input-icon${errors.from_email ? ' input-error' : ''}`}
                      placeholder="jane@company.com"
                      onChange={() => clearError('from_email')} />
                  </div>
                  {errors.from_email && <p className="field-error">{errors.from_email}</p>}
                </div>
              </div>

              {/* Topic */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-topic">What can we help you with?</label>
                <select id="contact-topic" name="topic" defaultValue=""
                  className={`form-select${errors.topic ? ' input-error' : ''}`}
                  onChange={() => clearError('topic')}>
                  <option value="" disabled>Choose a topic…</option>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.topic && <p className="field-error">{errors.topic}</p>}
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-message">
                  Your Message
                  <span className={`char-count${charCount > 900 ? ' char-count-warn' : ''}`}>
                    {charCount} / 1000
                  </span>
                </label>
                <textarea id="contact-message" name="message" maxLength={1000}
                  className={`form-input cu-textarea${errors.message ? ' input-error' : ''}`}
                  placeholder="Tell us what's on your mind…"
                  onChange={e => { setCharCount(e.target.value.length); clearError('message'); }} />
                {errors.message && <p className="field-error">{errors.message}</p>}
              </div>

              {status === 'error' && (
                <div className="contact-error-banner">
                  <AlertCircle size={16} strokeWidth={2} />
                  Something went wrong. Please try again or email us at <strong>support@agentsql.ai</strong>.
                </div>
              )}

              <button id="contact-submit" type="submit"
                className="btn btn-primary cu-submit-btn"
                disabled={status === 'sending'}>
                {status === 'sending'
                  ? <><Spinner /> Sending your message…</>
                  : <><Send size={15} strokeWidth={2} /> Send Message <ArrowRight size={14} strokeWidth={2.5} /></>
                }
              </button>
            </form>
          )}
        </div>

        {/* ── Right: Side Info ── */}
        <aside className="cu-side">
          {/* FAQ items */}
          <div className="cu-side-card">
            <div className="cu-side-card-header">
              <Sparkles size={15} strokeWidth={2} color="var(--amber)" />
              <span>Common Questions</span>
            </div>
            {[
              { q: 'How quickly will you reply?', a: 'Our team typically replies within 24 hours on business days.' },
              { q: 'Can I request a demo?', a: `Absolutely! Select "General Inquiry" and mention you'd like a demo.` },
              { q: 'Is my data safe?', a: 'Yes — read our Privacy Policy for full details on how we protect your information.' },
              { q: 'Do you offer a free plan?', a: `Yes, we have a free tier. Select "General Inquiry" to learn more.` },
            ].map(({ q, a }) => (
              <div key={q} className="cu-faq-item">
                <p className="cu-faq-q">{q}</p>
                <p className="cu-faq-a">{a}</p>
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <div className="cu-privacy-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="var(--royal-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p>Your information is kept private per our <Link to="/privacy">Privacy Policy</Link>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
