import { useEffect, useState } from 'react';
import { request } from '../api/api';
import {
  Database, PlusCircle, Link2, Plug, RefreshCw, Trash2,
  ServerCrash, ChevronDown, ChevronUp, Table2, Columns3,
  Loader2, Shield, Zap, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const FIELD_META = [
  { key: 'name',     label: 'Connection Name',   placeholder: 'e.g. My Store DB',    type: 'text',     required: false, half: true },
  { key: 'host',     label: 'Host',               placeholder: 'localhost or IP',      type: 'text',     required: true,  half: true },
  { key: 'port',     label: 'Port',               placeholder: '3306',                 type: 'text',     required: true,  half: true },
  { key: 'user',     label: 'Username',           placeholder: 'root',                 type: 'text',     required: true,  half: true },
  { key: 'database', label: 'Database Name',      placeholder: 'my_database',          type: 'text',     required: true,  half: true },
  { key: 'password', label: 'Password',           placeholder: '••••••••',             type: 'password', required: false, half: true },
];

const PALETTES = [
  { bg: '#1E3A5F', text: '#60AFFF', border: '#2A5080' },
  { bg: '#1A3D2B', text: '#4ADE80', border: '#245234' },
  { bg: '#3D1F00', text: '#FB923C', border: '#5A3000' },
  { bg: '#2D1B4E', text: '#C084FC', border: '#3E2466' },
  { bg: '#1F3640', text: '#2DD4BF', border: '#2A4D5A' },
  { bg: '#3D1A2E', text: '#F472B6', border: '#5A2442' },
  { bg: '#2C2A10', text: '#FACC15', border: '#413E18' },
  { bg: '#1A2B3D', text: '#38BDF8', border: '#253D55' },
];

export default function SavedConnections() {
  const [connections,    setConnections]    = useState([]);
  const [form,           setForm]           = useState({ name: '', host: 'mysql', port: '3306', user: 'agentsql', password: 'agentsql123', database: 'agentsql' });
  const [message,        setMessage]        = useState({ text: '', type: '' });
  const [loading,        setLoading]        = useState(false);
  const [pageLoading,    setPageLoading]    = useState(true);
  const [schemas,        setSchemas]        = useState({});
  const [loadingSchema,  setLoadingSchema]  = useState({});
  const [expandedConn,   setExpandedConn]   = useState(null);
  const [testResults,    setTestResults]    = useState({});

  async function loadConnections() {
    try {
      const data = await request('/databases');
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { loadConnections(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const data = await request('/databases', { method: 'POST', body: JSON.stringify(form) });
      setMessage({ text: data.message || 'Connection saved!', type: 'success' });
      setForm({ name: '', host: 'mysql', port: '3306', user: 'agentsql', password: 'agentsql123', database: 'agentsql' });
      await loadConnections();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleTest(conn) {
    setTestResults(p => ({ ...p, [conn.id]: 'testing' }));
    try {
      // Send only the id — server fetches & decrypts real credentials internally
      const data = await request('/databases/test', { method: 'POST', body: JSON.stringify({ id: conn.id }) });
      setTestResults(p => ({ ...p, [conn.id]: data.connected ? 'ok' : 'fail' }));
      setMessage({ text: data.message, type: data.connected ? 'success' : 'error' });
    } catch (err) {
      setTestResults(p => ({ ...p, [conn.id]: 'fail' }));
      setMessage({ text: err.message, type: 'error' });
    }
  }

  async function handleRefreshSchema(conn) {
    const id = conn.id;
    setLoadingSchema(p => ({ ...p, [id]: true }));
    setMessage({ text: '', type: '' });
    try {
      // Send only the id — server fetches & decrypts real credentials internally
      const data = await request('/databases/refresh-schema', { method: 'POST', body: JSON.stringify({ id }) });
      if (Array.isArray(data.schema)) {
        setSchemas(p => ({ ...p, [id]: data.schema }));
        setExpandedConn(id);
      }
      setMessage({ text: `Schema loaded: ${data.schema?.length || 0} tables`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoadingSchema(p => ({ ...p, [id]: false }));
    }
  }

  async function handleDelete(id) {
    try {
      await request(`/databases/${id}`, { method: 'DELETE' });
      setSchemas(p => { const n = { ...p }; delete n[id]; return n; });
      setTestResults(p => { const n = { ...p }; delete n[id]; return n; });
      if (expandedConn === id) setExpandedConn(null);
      await loadConnections();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  return (
    <div className="sc-root fade-in">

      {/* ══ Page Header ════════════════════════════════════════════ */}
      <div className="sc-header">
        <div className="sc-header-left">
          <div className="sc-header-icon">
            <Database size={20} strokeWidth={1.8} color="var(--royal-blue)" />
          </div>
          <div>
            <h1>Database Connections</h1>
            <p>Manage your MySQL connections for the AI workspace</p>
          </div>
        </div>
        <div className="sc-header-stat">
          <span className="sc-stat-num">{connections.length}</span>
          <span className="sc-stat-label">Saved</span>
        </div>
      </div>

      {/* ══ Status Banner ══════════════════════════════════════════ */}
      {message.text && (
        <div className={`sc-banner sc-banner-${message.type}`}>
          {message.type === 'success'
            ? <CheckCircle2 size={15} strokeWidth={2} />
            : <AlertTriangle size={15} strokeWidth={2} />
          }
          {message.text}
        </div>
      )}

      {/* ══ Add Connection Form ════════════════════════════════════ */}
      <div className="sc-form-card">
        {/* Card header */}
        <div className="sc-form-card-header">
          <div className="sc-form-card-icon">
            <PlusCircle size={18} strokeWidth={2} color="var(--royal-blue)" />
          </div>
          <div>
            <h2 className="sc-form-card-title">Add New Connection</h2>
            <p className="sc-form-card-sub">Your credentials are encrypted and stored securely.</p>
          </div>
          <div className="sc-secure-badge">
            <Shield size={12} strokeWidth={2} />
            Encrypted
          </div>
        </div>

        <form onSubmit={handleSave} className="sc-form-grid">
          {FIELD_META.map(({ key, label, placeholder, type, required }) => (
            <div key={key} className="form-group">
              <label className="form-label" htmlFor={`conn-${key}`}>{label}</label>
              <input
                id={`conn-${key}`}
                name={key}
                type={type}
                className="form-input"
                placeholder={placeholder}
                value={form[key]}
                required={required}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sc-form-submit-row">
            <button id="conn-save" type="submit" className="btn btn-primary sc-save-btn" disabled={loading}>
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Database size={15} strokeWidth={2} /> Save Connection</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ══ Saved Connections ═════════════════════════════════════= */}
      <div className="sc-list-card">
        <div className="sc-list-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link2 size={16} strokeWidth={2} color="var(--royal-blue)" />
            <span className="sc-list-title">Saved Connections</span>
          </div>
          <span className="sc-list-count">{connections.length} connection{connections.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Loading */}
        {pageLoading && (
          <div className="sc-empty">
            <Loader2 size={30} color="var(--royal-blue)" strokeWidth={1.5}
              style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
            <p>Loading your connections…</p>
          </div>
        )}

        {/* Empty state */}
        {!pageLoading && connections.length === 0 && (
          <div className="sc-empty">
            <div className="sc-empty-icon">
              <ServerCrash size={28} strokeWidth={1.5} color="var(--text-muted)" />
            </div>
            <p className="sc-empty-title">No connections yet</p>
            <p className="sc-empty-sub">Add your first MySQL connection using the form above.</p>
          </div>
        )}

        {/* Connection cards */}
        <div className="sc-conn-list">
          {connections.map(conn => {
            const schema      = schemas[conn.id] || [];
            const isExpanded  = expandedConn === conn.id;
            const isLoadingSch = loadingSchema[conn.id];
            const testState   = testResults[conn.id]; // undefined | 'testing' | 'ok' | 'fail'

            return (
              <div key={conn.id} className="sc-conn-card">
                {/* Top accent bar */}
                <div className="sc-conn-bar" />

                {/* Connection info row */}
                <div className="sc-conn-row">
                  <div className="sc-conn-db-icon">
                    <Database size={18} strokeWidth={1.8} color="var(--royal-blue)" />
                  </div>
                  <div className="sc-conn-info">
                    <div className="sc-conn-name">{conn.name || conn.database}</div>
                    <div className="sc-conn-host">
                      {conn.user}@{conn.host}:{conn.port || 3306}/{conn.database}
                    </div>
                  </div>

                  {/* Test status pill */}
                  {testState && (
                    <div className={`sc-test-pill sc-test-${testState}`}>
                      {testState === 'testing' && <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />}
                      {testState === 'ok'      && <CheckCircle2 size={11} strokeWidth={2.5} />}
                      {testState === 'fail'    && <AlertTriangle size={11} strokeWidth={2.5} />}
                      {testState === 'testing' ? 'Testing…' : testState === 'ok' ? 'Connected' : 'Failed'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="sc-conn-actions">
                    <button className="sc-action-btn sc-action-test" onClick={() => handleTest(conn)}
                      title="Test connection">
                      <Plug size={13} strokeWidth={2} />
                      <span>Test</span>
                    </button>

                    <button className="sc-action-btn sc-action-schema"
                      onClick={() => handleRefreshSchema(conn)}
                      disabled={isLoadingSch} title="Load schema">
                      <RefreshCw size={13} strokeWidth={2}
                        style={{ animation: isLoadingSch ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{isLoadingSch ? 'Loading…' : 'Schema'}</span>
                    </button>

                    {schema.length > 0 && (
                      <button className="sc-action-btn sc-action-toggle"
                        onClick={() => setExpandedConn(isExpanded ? null : conn.id)}>
                        {isExpanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
                        <span>{schema.length} tables</span>
                      </button>
                    )}

                    <button className="sc-action-btn sc-action-delete" onClick={() => handleDelete(conn.id)}
                      title="Delete connection">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Schema explorer */}
                {isExpanded && schema.length > 0 && (
                  <div className="sc-schema">
                    <div className="sc-schema-header">
                      <Columns3 size={13} strokeWidth={2} color="var(--amber)" />
                      <span>Schema Explorer — <strong>{conn.database}</strong></span>
                      <span className="sc-schema-count">{schema.length} tables</span>
                    </div>

                    <div className="sc-schema-grid">
                      {schema.map((table, ti) => {
                        const pal = PALETTES[ti % PALETTES.length];
                        return (
                          <div key={table.name} className="sc-table-card"
                            style={{ '--pal-bg': pal.bg, '--pal-text': pal.text, '--pal-border': pal.border }}>
                            {/* Table header */}
                            <div className="sc-table-header">
                              <Table2 size={12} strokeWidth={2} />
                              <span className="sc-table-name">{table.name}</span>
                              <span className="sc-table-count">{table.columns?.length || 0} cols</span>
                            </div>
                            {/* Columns */}
                            <div className="sc-col-list">
                              {Array.isArray(table.columns) && table.columns.map((col, ci) => {
                                const colName = typeof col === 'string' ? col : col.name || col.column_name || String(col);
                                const colType = typeof col === 'object' ? (col.type || col.data_type || '') : '';
                                return (
                                  <div key={ci} className="sc-col-row"
                                    style={{ borderBottom: ci < table.columns.length - 1 ? `1px solid ${pal.border}44` : 'none' }}>
                                    <span className="sc-col-name">{colName}</span>
                                    {colType && (
                                      <span className="sc-col-type"
                                        style={{ color: pal.text, background: `${pal.bg}CC` }}>
                                        {colType}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
