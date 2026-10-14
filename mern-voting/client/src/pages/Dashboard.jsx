import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, formatDate } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';

const TABS = [
  { key: 'active', label: 'Open now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Closed' },
  { key: 'all', label: 'All' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (user.role === 'admin') return;
    api
      .get('/elections')
      .then((res) => setElections(res.data))
      .catch((err) => setError(errMsg(err)));
  }, [user.role]);

  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const list = (elections || []).filter((e) => tab === 'all' || e.status === tab);
  const countOf = (key) => (elections || []).filter((e) => key === 'all' || e.status === key).length;
  const pending = (elections || []).filter((e) => e.status === 'active' && !e.hasVoted).length;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="muted">
            {elections === null
              ? 'Loading your elections…'
              : pending > 0
              ? `You have ${pending} election${pending > 1 ? 's' : ''} waiting for your vote.`
              : 'You are all caught up. Check back when new elections open.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'tab--on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="tab__count">{countOf(t.key)}</span>
          </button>
        ))}
      </div>

      {elections !== null && list.length === 0 && (
        <div className="empty">
          <h3>No elections here yet</h3>
          <p className="muted">Elections in this category will appear when an administrator publishes them.</p>
        </div>
      )}

      <div className="grid">
        {list.map((e) => (
          <Link to={`/elections/${e._id}`} key={e._id} className={`ticket ticket--${e.status}`}>
            <div className="ticket__top">
              <StatusBadge status={e.status} />
              {e.hasVoted && <span className="chip chip--done">You voted</span>}
            </div>
            <h3>{e.title}</h3>
            <p className="ticket__desc">{e.description || 'No description provided.'}</p>
            <dl className="ticket__meta">
              <div><dt>Opens</dt><dd>{formatDate(e.startDate)}</dd></div>
              <div><dt>Closes</dt><dd>{formatDate(e.endDate)}</dd></div>
              <div><dt>Candidates</dt><dd>{e.candidateCount}</dd></div>
            </dl>
            <span className="ticket__cta">
              {e.status === 'active' && !e.hasVoted ? 'Cast your vote' : e.status === 'ended' ? 'View results' : 'View details'}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
