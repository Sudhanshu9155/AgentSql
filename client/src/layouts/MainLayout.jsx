import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, MessageSquare, BarChart2, Database,
  History, Settings, LogOut, Zap, Database as DbIcon,
  ShieldCheck, Phone, BookOpen,
} from 'lucide-react';

const links = [
  { to: '/dashboard',         label: 'Dashboard',        Icon: LayoutDashboard, section: 'workspace' },
  { to: '/chat',              label: 'AI Chat',           Icon: MessageSquare,   section: 'workspace' },
  { to: '/analytics',         label: 'Analytics',         Icon: BarChart2,       section: 'workspace' },
  { to: '/saved-connections', label: 'Connections',       Icon: Database,        section: 'data' },
  { to: '/query-history',     label: 'History',           Icon: History,         section: 'data' },
  { to: '/settings',          label: 'Settings',          Icon: Settings,        section: 'account' },
  { to: '/privacy',           label: 'Privacy Policy',    Icon: ShieldCheck,     section: 'legal' },
  { to: '/contact',           label: 'Contact Us',        Icon: Phone,           section: 'legal' },
  { to: '/manual',            label: 'User Manual',       Icon: BookOpen,        section: 'help' },
];

const PAGE_LABELS = {
  '/dashboard':         'Dashboard',
  '/chat':              'AI Chat',
  '/analytics':         'Analytics',
  '/saved-connections': 'Connections',
  '/query-history':     'Query History',
  '/settings':          'Settings',
  '/privacy':           'Privacy Policy',
  '/contact':           'Contact Us',
  '/manual':            'User Manual',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = PAGE_LABELS[location.pathname] || 'AgentSQL';
  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  function handleLogout() { logout(); navigate('/login'); }

  const workspaceLinks = links.filter(l => l.section === 'workspace');
  const dataLinks      = links.filter(l => l.section === 'data');
  const accountLinks   = links.filter(l => l.section === 'account');
  const legalLinks     = links.filter(l => l.section === 'legal');
  const helpLinks      = links.filter(l => l.section === 'help');

  return (
    <div className="layout-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <DbIcon size={18} color="#fff" strokeWidth={2} />
          </div>
          <h2>AgentSQL</h2>
          <p>AI Database Studio</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {workspaceLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={16} strokeWidth={1.8} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Data</div>
          {dataLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={16} strokeWidth={1.8} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Account</div>
          {accountLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={16} strokeWidth={1.8} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Legal</div>
          {legalLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={16} strokeWidth={1.8} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Help</div>
          {helpLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={16} strokeWidth={1.8} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <LogOut size={16} strokeWidth={1.8} className="nav-link-icon" />
            Logout
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="content-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-breadcrumb">
              AgentSQL &rsaquo; <span>{currentPage}</span>
            </span>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">
              <Zap size={12} strokeWidth={2} style={{ marginRight: 4 }} />
              AI-Powered
            </span>
            <div className="topbar-user">
              <div className="topbar-avatar">{initials}</div>
              <span>{user?.name || user?.email || 'Guest'}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
