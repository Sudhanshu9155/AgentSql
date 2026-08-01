import { useEffect, useState } from 'react';
import { request } from '../api/api';
import AutoChart from '../components/AutoChart';
import {
  Search, Clock, ChevronDown, ChevronUp,
  Terminal, BarChart2, Lightbulb, MessageSquare,
  HelpCircle, Code2, Zap, TrendingUp,
} from 'lucide-react';

/* ── Single expandable chat entry ── */
function HistoryEntry({ item }) {
  const [open, setOpen] = useState(false);

  const hasData = item.sql || item.analysis || item.chart_config || item.row_count != null;

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--white)',
      transition: 'box-shadow 0.2s',
      boxShadow: open ? '0 4px 18px rgba(16,41,55,0.09)' : 'none',
    }}>
      {/* Row header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '0.75rem', padding: '0.9rem 1.1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
          background: hasData ? 'rgba(18,77,84,0.09)' : 'rgba(214,196,176,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageSquare size={15} color={hasData ? 'var(--teal)' : 'var(--text-muted)'} strokeWidth={2} />
        </div>

        {/* Question */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.question}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
            {item.timestamp && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={11} strokeWidth={2} />
                {new Date(item.timestamp).toLocaleString()}
              </span>
            )}
            {item.row_count != null && (
              <span style={{ fontSize: '0.75rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                <BarChart2 size={11} strokeWidth={2} />
                {item.row_count} rows
              </span>
            )}
            {!hasData && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No data generated</span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        {hasData && (
          <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            {open ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
          </div>
        )}
      </button>

      {/* Expanded body */}
      {open && hasData && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Analysis text */}
          {item.analysis && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lightbulb size={12} strokeWidth={2} /> AI Analysis
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {item.analysis}
              </div>
            </div>
          )}

          {/* SQL block */}
          {item.sql && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Terminal size={12} strokeWidth={2} /> Generated SQL
              </div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(18,77,84,0.2)' }}>
                <div style={{ background: 'var(--teal-deep)', padding: '0.35rem 0.8rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  {item.decision || 'SQL Query'}
                </div>
                <pre style={{ margin: 0, padding: '0.75rem 0.9rem', background: 'var(--navy)', color: '#a8d4da', fontFamily: "'Fira Code','Courier New',monospace", fontSize: '0.8rem', overflowX: 'auto', lineHeight: '1.5' }}>
                  {item.sql}
                </pre>
              </div>
            </div>
          )}

          {/* Results table */}
          {item.columns?.length > 0 && item.rows?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <BarChart2 size={12} strokeWidth={2} /> Query Results — {item.row_count} row(s)
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <table className="results-table">
                  <thead>
                    <tr>{item.columns.map(col => <th key={col}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {item.rows.slice(0, 10).map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{String(cell ?? '')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart */}
          {item.chart_config && item.chart_config.type !== 'table' && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={12} strokeWidth={2} /> Chart
              </div>
              <AutoChart config={item.chart_config} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Analytics page ── */
export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    request('/chat/history')
      .then(data => setHistory(Array.isArray(data) ? [...data].reverse() : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h =>
    !search ||
    h.question?.toLowerCase().includes(search.toLowerCase()) ||
    h.sql?.toLowerCase().includes(search.toLowerCase()) ||
    h.analysis?.toLowerCase().includes(search.toLowerCase())
  );

  const totalQueries   = history.length;
  const sqlGenerated   = history.filter(h => h.sql).length;
  const chartsGenerated= history.filter(h => h.chart_config && h.chart_config.type !== 'table').length;
  const withAnalysis   = history.filter(h => h.analysis && !h.analysis.includes('Error')).length;

  const kpis = [
    { label: 'Total Queries',   value: totalQueries,    Icon: HelpCircle, color: '#102937' },
    { label: 'SQL Generated',   value: sqlGenerated,    Icon: Code2,      color: '#124d54' },
    { label: 'Charts Created',  value: chartsGenerated, Icon: BarChart2,  color: '#f9744b' },
    { label: 'AI Analyses',     value: withAnalysis,    Icon: Zap,        color: '#d84f2a' },
  ];

  return (
    <div className="fade-in">
      {/* Page header */}
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Search and review every data analysis from your AI Chat sessions</p>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
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

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search
          size={15} strokeWidth={2}
          style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
        <input
          id="analytics-search"
          className="form-input"
          style={{ paddingLeft: '2.4rem', maxWidth: '480px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions, SQL, or analysis text…"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', left: '470px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}
          >×</button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500 }}>
          {search
            ? `${filtered.length} result(s) for "${search}"`
            : `${filtered.length} chat session(s)`}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="loading-dots"><span/><span/><span/></div>
        </div>
      )}

      {/* Empty states */}
      {!loading && history.length === 0 && (
        <div className="empty-state">
          <MessageSquare size={30} color="var(--text-muted)" strokeWidth={1.4} style={{ marginBottom: '0.5rem' }} />
          <p>No chat history yet. Go to <strong>AI Chat</strong> to start analyzing your database.</p>
        </div>
      )}

      {!loading && history.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <Search size={28} color="var(--text-muted)" strokeWidth={1.4} style={{ marginBottom: '0.5rem' }} />
          <p>No results match <strong>&quot;{search}&quot;</strong>. Try a different keyword.</p>
        </div>
      )}

      {/* Chat history list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map((item, idx) => (
            <HistoryEntry key={item.id || idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
