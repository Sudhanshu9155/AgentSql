import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Database, Eye, Lock, Clock, UserCheck,
  Cookie, Zap, RefreshCw, Mail, ChevronRight, CheckCircle,
  FileText, MessageSquare,
} from 'lucide-react';

/* ── Section data ──────────────────────────────────────────────────── */
const sections = [
  {
    id: 'collect',
    num: '01',
    Icon: Eye,
    color: '#3457D5',
    colorSoft: 'rgba(52,87,213,0.10)',
    title: 'What Information We Collect',
    items: [
      { label: 'Your Name & Email', desc: 'When you create an account, we ask for your name and email address so we know who you are.' },
      { label: 'Your Password', desc: 'We store your password in a scrambled form — even we cannot read it. It is kept safe.' },
      { label: 'Your Database Details', desc: 'If you connect a database, we save the details you give us (like the address and login). We only use this to run your queries.' },
      { label: 'How You Use the App', desc: 'We keep a record of the questions you ask and the results you get. This helps us make the app better for you.' },
      { label: 'Your Device Info', desc: 'We may note basic things like what browser you use. This helps us fix problems if something goes wrong.' },
    ],
  },
  {
    id: 'use',
    num: '02',
    Icon: Zap,
    color: '#FFB020',
    colorSoft: 'rgba(255,176,32,0.12)',
    title: 'Why We Use Your Information',
    items: [
      { label: 'To Let You Log In', desc: 'We use your email and password to make sure only you can get into your account.' },
      { label: 'To Answer Your Questions', desc: 'When you ask a question about your data, we use your details to fetch the right answer for you.' },
      { label: 'To Show You Useful Charts', desc: 'We use your past questions to create helpful summaries and charts on your dashboard.' },
      { label: 'To Keep the App Running Smoothly', desc: 'We look at general usage to spot and fix any errors or slowdowns.' },
      { label: 'We Never Sell Your Data', desc: 'We will never sell, share, or rent your information to advertisers or any other companies. Ever.' },
    ],
  },
  {
    id: 'security',
    num: '03',
    Icon: Lock,
    color: '#10B981',
    colorSoft: 'rgba(16,185,129,0.10)',
    title: 'How We Keep Your Data Safe',
    items: [
      { label: 'Stored Securely', desc: 'All your information is kept on secure servers that only trusted staff can access.' },
      { label: 'Passwords Are Scrambled', desc: 'Your password is turned into a secret code before saving. Nobody — including us — can read it.' },
      { label: 'Safe Connection', desc: 'When you use the app, your information travels through a secure, private connection — like an envelope that only you and we can open.' },
      { label: 'Limited Access', desc: 'Only a small number of trusted team members can access your data, and only when absolutely necessary.' },
    ],
  },
  {
    id: 'retention',
    num: '04',
    Icon: Clock,
    color: '#8B5CF6',
    colorSoft: 'rgba(139,92,246,0.10)',
    title: 'How Long We Keep Your Data',
    items: [
      { label: 'While Your Account is Open', desc: 'We keep your information for as long as you have an account with us.' },
      { label: 'Your Question History', desc: 'We save up to 12 months of your past questions. You can delete them yourself anytime from the History page.' },
      { label: 'When You Delete Your Account', desc: 'If you close your account, we will delete all your personal information within 30 days.' },
    ],
  },
  {
    id: 'rights',
    num: '05',
    Icon: UserCheck,
    color: '#EF4444',
    colorSoft: 'rgba(239,68,68,0.09)',
    title: 'Your Rights',
    items: [
      { label: 'See Your Data', desc: 'You can ask us to show you all the information we have about you.' },
      { label: 'Fix Your Details', desc: 'You can update your name or email at any time from the Settings page.' },
      { label: 'Delete Everything', desc: 'You can ask us to completely delete your account and all your data.' },
      { label: 'Take Your Data With You', desc: 'You can download your question history as a file so you can keep a copy.' },
    ],
  },
  {
    id: 'cookies',
    num: '06',
    Icon: Cookie,
    color: '#F59E0B',
    colorSoft: 'rgba(245,158,11,0.10)',
    title: 'Cookies (Small Files on Your Browser)',
    items: [
      { label: 'What is a Cookie?', desc: 'A cookie is a tiny file saved in your browser that helps the app remember you are logged in.' },
      { label: 'We Only Use What We Need', desc: 'We only use the cookie that keeps you logged in. We do not use cookies to track you or show you ads.' },
      { label: 'Your Choice', desc: 'You can turn off cookies in your browser, but this means you will not be able to log in to the app.' },
    ],
  },
  {
    id: 'third-party',
    num: '07',
    Icon: Database,
    color: '#06B6D4',
    colorSoft: 'rgba(6,182,212,0.10)',
    title: 'Other Services We Work With',
    items: [
      { label: 'AI Assistant', desc: 'We use Google\'s AI to understand your questions and turn them into database queries. We do not send your personal details to Google.' },
      { label: 'No Ads or Trackers', desc: 'We do not use any advertising services or hidden tracking tools. What you do in the app stays in the app.' },
    ],
  },
  {
    id: 'changes',
    num: '08',
    Icon: RefreshCw,
    color: '#3457D5',
    colorSoft: 'rgba(52,87,213,0.10)',
    title: 'If We Update This Policy',
    items: [
      { label: 'We Will Tell You', desc: 'If we make any important changes, we will update the date at the top of this page so you always know when it was last changed.' },
      { label: 'Continuing to Use the App', desc: 'If you keep using AgentSQL after we update this policy, it means you are happy with the changes.' },
    ],
  },
  {
    id: 'contact',
    num: '09',
    Icon: Mail,
    color: '#10B981',
    colorSoft: 'rgba(16,185,129,0.10)',
    title: 'Questions? Talk to Us',
    items: [
      { label: 'We Are Here to Help', desc: 'If you have any questions about how we use your information, or if you want to see, fix, or delete your data — just contact us. We are happy to help.' },
      { label: 'Email Us', desc: 'You can reach our privacy team at privacy@agentsql.ai and we will get back to you within 24 hours.' },
    ],
  },
];

/* ── Stats strip ───────────────────────────────────────────────────── */
const stats = [
  { value: 'Locked', label: 'Your Password' },
  { value: 'Private', label: 'Your Connection' },
  { value: '30 Days', label: 'To Delete Your Data' },
  { value: 'Zero', label: 'Ads or Trackers' },
];

/* ── Component ─────────────────────────────────────────────────────── */
export default function PrivacyPolicy() {
  const [active, setActive] = useState(null);

  return (
    <div className="pp-root">

      {/* ══ Hero Banner ════════════════════════════════════════════ */}
      <div className="pp-hero">
        {/* Decorative orbs */}
        <div className="pp-orb pp-orb-1" />
        <div className="pp-orb pp-orb-2" />

        <div className="pp-hero-inner">
          <div className="pp-hero-badge">
            <ShieldCheck size={13} strokeWidth={2.5} />
            Legal · Privacy
          </div>

          <h1 className="pp-hero-title">Privacy Policy</h1>
          <p className="pp-hero-sub">
            Last updated <strong>July 26, 2026</strong>
          </p>
          <p className="pp-hero-desc">
            We want to be honest and clear about how we handle your information.
            This page explains — in plain language — what we collect, how we use
            it, and what you can do if you have any concerns.
          </p>

          {/* Stats strip */}
          <div className="pp-stats">
            {stats.map(s => (
              <div key={s.label} className="pp-stat">
                <span className="pp-stat-value">{s.value}</span>
                <span className="pp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Body (TOC + Sections) ═══════════════════════════════════ */}
      <div className="pp-body">

        {/* ── Table of Contents ── */}
        <aside className="pp-toc">
          <p className="pp-toc-title">
            <FileText size={13} strokeWidth={2.5} />
            On this page
          </p>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`pp-toc-link${active === s.id ? ' pp-toc-link-active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              <span className="pp-toc-num">{s.num}</span>
              {s.title}
              <ChevronRight size={12} strokeWidth={2} className="pp-toc-arrow" />
            </a>
          ))}

          {/* Quick contact card */}
          <div className="pp-toc-contact">
            <p>Questions about your data?</p>
            <Link to="/contact" className="pp-toc-contact-btn">
              <MessageSquare size={13} strokeWidth={2} />
              Contact Us
            </Link>
          </div>
        </aside>

        {/* ── Sections ── */}
        <main className="pp-sections">
          {sections.map(({ id, num, Icon, color, colorSoft, title, items }) => (
            <div
              key={id}
              id={id}
              className="pp-card"
              style={{ '--card-color': color, '--card-soft': colorSoft }}
            >
              {/* Card top accent bar */}
              <div className="pp-card-bar" />

              {/* Header row */}
              <div className="pp-card-header">
                <div className="pp-card-icon-wrap">
                  <Icon size={20} strokeWidth={1.8} color={color} />
                </div>
                <div>
                  <span className="pp-card-num">{num}</span>
                  <h2 className="pp-card-title">{title}</h2>
                </div>
              </div>

              {/* Items */}
              <div className="pp-items">
                {items.map(({ label, desc }) => (
                  <div key={label} className="pp-item">
                    <div className="pp-item-check">
                      <CheckCircle size={14} strokeWidth={2} color={color} />
                    </div>
                    <div className="pp-item-body">
                      <span className="pp-item-label">{label}</span>
                      <span className="pp-item-desc">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── CTA card ── */}
          <div className="pp-cta-card">
            <div className="pp-cta-icon">
              <ShieldCheck size={28} strokeWidth={1.5} color="var(--royal-blue)" />
            </div>
            <div className="pp-cta-body">
              <h3>Still have questions?</h3>
              <p>We are happy to explain anything in more detail. Just send us a message or email us at <strong>privacy@agentsql.ai</strong> — we usually reply the same day.</p>
            </div>
            <Link to="/contact" className="btn btn-primary pp-cta-btn">
              <MessageSquare size={15} strokeWidth={2} />
              Contact Us
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
