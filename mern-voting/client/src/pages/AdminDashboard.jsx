import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { errMsg, formatDate } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([api.get('/admin/stats'), api.get('/elections')]);
      setStats(s.data);
      setElections(e.data);
    } catch (err) {
      setError(errMsg(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (e) => {
    if (!window.confirm(`Delete "${e.title}" and all of its votes? This cannot be undone.`)) return;
    try {
      await api.delete(`/elections/${e._id}`);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const cards = stats
    ? [
        { label: 'Registered voters', value: stats.voters },
        { label: 'Elections', value: stats.elections },
        { label: 'Open now', value: stats.activeElections },
        { label: 'Votes cast', value: stats.votes },
      ]
    : [];

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1>Administration</h1>
          <p className="muted">Create elections, monitor turnout and review results.</p>
        </div>
        <Link to="/admin/elections/new" className="btn btn--gold">New election</Link>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="stats">
        {cards.map((c) => (
          <div className="stat" key={c.label}>
            <span className="stat__value">{c.value}</span>
            <span className="stat__label">{c.label}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>All elections</h2>
        {elections !== null && elections.length === 0 && (
          <div className="empty">
            <h3>No elections yet</h3>
            <p className="muted">Create your first election to open it to voters.</p>
          </div>
        )}
        {elections !== null && elections.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Election</th>
                  <th>Status</th>
                  <th>Votes</th>
                  <th>Closes</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {elections.map((e) => (
                  <tr key={e._id}>
                    <td data-label="Election"><strong>{e.title}</strong><small>{e.candidateCount} candidates</small></td>
                    <td data-label="Status"><StatusBadge status={e.status} /></td>
                    <td data-label="Votes">{e.totalVotes}</td>
                    <td data-label="Closes">{formatDate(e.endDate)}</td>
                    <td className="table__actions">
                      <Link className="btn btn--outline btn--sm" to={`/elections/${e._id}`}>Results</Link>
                      {e.totalVotes === 0 && <Link className="btn btn--outline btn--sm" to={`/admin/elections/${e._id}/edit`}>Edit</Link>}
                      <button className="btn btn--danger btn--sm" onClick={() => remove(e)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
