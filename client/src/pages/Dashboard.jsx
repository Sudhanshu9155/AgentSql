import { useEffect, useState } from 'react';
import { request } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Search, Zap, CheckCircle2, UserCircle2, Clock, Code2, MessageSquare, Database } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [connCount, setConnCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hist, conns] = await Promise.all([
          request('/chat/history'),
          request('/databases'),
        ]);
        const histArr = Array.isArray(hist) ? hist : [];
        setHistory(histArr.slice(-5).reverse());
        setConnCount(Array.isArray(conns) ? conns.length : 0);
      } catch { /* non-critical */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  // Compute stats from real history
  const allHistory = history;
  const successCount = allHistory.filter(h => h.decision !== 'fallback' && h.sql).length;
  const successRate = allHistory.length > 0 ? `${Math.round((successCount / allHistory.length) * 100)}%` : '—';

  const kpis = [
    { label: 'Queries Run',   value: allHistory.length || 0,  Icon: Search,       color: '#3457D5' },
    { label: 'Success Rate',  value: successRate,              Icon: CheckCircle2, color: '#16a34a' },
    { label: 'Connections',   value: connCount,                Icon: Database,     color: '#FFB020' },
    { label: 'Role',          value: user?.role || 'user',     Icon: UserCircle2,  color: '#10192E' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, <strong>{user?.name || user?.email}</strong>. Here&apos;s your AI SQL workspace overview.</p>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        {kpis.map(({ label, value, Icon, color }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: `${color}15` }}>
              <Icon size={18} color={color} strokeWidth={1.8} />
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Queries */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Queries</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last 5 sessions</span>
        </div>

        {loading && (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="loading-dots"><span/><span/><span/></div>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="empty-state">
            <MessageSquare size={28} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: '0.5rem' }} />
            <p>No queries yet. Head to <strong>AI Chat</strong> to ask your first question!</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {history.map(entry => (
              <div key={entry.id} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>{entry.question}</div>
                {entry.sql && (
                  <code style={{ fontSize: '0.78rem', color: 'var(--teal)', background: 'rgba(18,77,84,0.07)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {entry.sql.slice(0, 80)}{entry.sql.length > 80 ? '…' : ''}
                  </code>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {entry.row_count != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Code2 size={11} strokeWidth={2} /> {entry.row_count} rows
                    </span>
                  )}
                  {entry.timestamp && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} strokeWidth={2} /> {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
