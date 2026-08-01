import { useEffect, useState } from 'react';
import { request } from '../api/api';
import { Clock, MessageSquare, Search, Loader2, User } from 'lucide-react';

export default function QueryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetches ONLY this logged-in user's history (server filters by userId from JWT)
    request('/chat/history')
      .then(data => setHistory(Array.isArray(data) ? [...data].reverse() : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h =>
    !search ||
    h.question?.toLowerCase().includes(search.toLowerCase()) ||
    h.analysis?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Query History</h2>
        <p>All questions you've asked — showing only your personal history</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '420px', position: 'relative' }}>
        <Search
          size={15} strokeWidth={2}
          style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
        <input
          id="history-search"
          className="form-input"
          style={{ paddingLeft: '2.25rem' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions…"
        />
      </div>

      {/* Loading spinner */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={30} color="var(--teal)" strokeWidth={1.5}
            style={{ marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading your query history…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <Clock size={28} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: '0.5rem' }} />
          <p>{search ? 'No questions match your search.' : 'No questions asked yet. Start chatting!'}</p>
        </div>
      )}

      {/* Results count */}
      {!loading && history.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500 }}>
          <User size={13} strokeWidth={2} />
          {search
            ? `${filtered.length} result(s) for "${search}"`
            : `${filtered.length} question(s) in your history`}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(entry => (
          <div key={entry.id} className="card" style={{ padding: '1rem' }}>

            {/* Question */}
            <div style={{
              fontWeight: 600, marginBottom: '0.5rem',
              color: 'var(--navy)', fontSize: '0.92rem',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <MessageSquare size={15} color="var(--teal)" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
              {entry.question}
            </div>

            {/* AI analysis / result summary */}
            {entry.analysis && !entry.analysis.toLowerCase().includes('error') && (
              <div style={{
                fontSize: '0.85rem', color: 'var(--text-secondary)',
                lineHeight: '1.55', marginBottom: '0.5rem',
                paddingLeft: '1.5rem',
              }}>
                {entry.analysis}
              </div>
            )}

            {/* Result count */}
            {entry.row_count != null && (
              <div style={{ paddingLeft: '1.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {entry.row_count} result{entry.row_count !== 1 ? 's' : ''} returned
                </span>
              </div>
            )}

            {/* Timestamp */}
            {entry.timestamp && (
              <div style={{
                fontSize: '0.75rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4,
                marginTop: '0.5rem', paddingLeft: '1.5rem',
              }}>
                <Clock size={11} strokeWidth={2} />
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

