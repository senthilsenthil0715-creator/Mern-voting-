import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, formatDate } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ElectionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [choice, setChoice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAdmin = user.role === 'admin';

  const load = useCallback(
    () =>
      api
        .get(`/elections/${id}`)
        .then((res) => setData(res.data))
        .catch((err) => setError(errMsg(err))),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Admins watch live totals while voting is open
  const liveAdmin = isAdmin && data && data.election.status === 'active';
  useEffect(() => {
    if (!liveAdmin) return undefined;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [liveAdmin, load]);

  const castVote = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/elections/${id}/vote`, { candidateId: choice });
      setSuccess(res.data.message);
      setChoice('');
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!data) {
    return (
      <main className="container">
        {error ? <div className="alert alert--error">{error}</div> : <p className="muted">Loading election…</p>}
        <Link to="/" className="back-link">Back to elections</Link>
      </main>
    );
  }

  const { election, hasVoted, results, totalVotes } = data;
  const canVote = user.role === 'voter' && election.status === 'active' && !hasVoted;
  const voteMap = new Map((results || []).map((r) => [r.candidateId, r.votes]));
  const topVotes = results ? Math.max(0, ...results.map((r) => r.votes)) : 0;
  const chosen = election.candidates.find((c) => c._id === choice);

  return (
    <main className="container container--narrow">
      <Link to={isAdmin ? '/admin' : '/'} className="back-link">Back to {isAdmin ? 'dashboard' : 'elections'}</Link>

      <header className="detail-head">
        <StatusBadge status={election.status} />
        <h1>{election.title}</h1>
        {election.description && <p className="detail-desc">{election.description}</p>}
        <p className="muted">
          Voting opens {formatDate(election.startDate)} and closes {formatDate(election.endDate)}.
        </p>
      </header>

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}. Thank you for voting.</div>}
      {hasVoted && !success && <div className="alert alert--success">You have already voted in this election.</div>}
      {election.status === 'upcoming' && <div className="alert alert--info">Voting has not opened yet. Come back on {formatDate(election.startDate)}.</div>}
      {election.status === 'active' && !isAdmin && !hasVoted && (
        <div className="alert alert--info">Choose one candidate. Your vote is final once submitted.</div>
      )}
      {election.status === 'active' && isAdmin && <div className="alert alert--info">Live totals refresh every 10 seconds. Voters see results only after the election closes.</div>}

      {canVote ? (
        <fieldset className="ballot">
          <legend className="sr-only">Candidates</legend>
          {election.candidates.map((c) => (
            <label key={c._id} className={`option ${choice === c._id ? 'option--on' : ''}`}>
              <input type="radio" name="candidate" value={c._id} checked={choice === c._id} onChange={() => setChoice(c._id)} />
              <span className="option__mark" aria-hidden="true" />
              <span className="option__text">
                <strong>{c.name}</strong>
                {c.party && <em>{c.party}</em>}
                {c.description && <small>{c.description}</small>}
              </span>
            </label>
          ))}
          <button className="btn btn--gold btn--block" disabled={!choice} onClick={() => setConfirming(true)}>
            Review and submit vote
          </button>
        </fieldset>
      ) : (
        <section className="candidates">
          <h2>{results ? 'Results' : 'Candidates'}</h2>
          {results && (
            <p className="muted">
              {totalVotes} vote{totalVotes === 1 ? '' : 's'} cast
              {election.status !== 'ended' ? ' so far' : ''}.
            </p>
          )}
          {election.candidates.map((c) => {
            const votes = voteMap.get(c._id) || 0;
            const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
            const leading = results && topVotes > 0 && votes === topVotes;
            return (
              <div key={c._id} className={`result ${leading && election.status === 'ended' ? 'result--win' : ''}`}>
                <div className="result__row">
                  <div>
                    <strong>{c.name}</strong>
                    {c.party && <span className="result__party">{c.party}</span>}
                    {leading && election.status === 'ended' && <span className="chip chip--win">Winner</span>}
                  </div>
                  {results && <span className="result__num">{votes} · {pct}%</span>}
                </div>
                {results && (
                  <div className="bar" role="img" aria-label={`${c.name}: ${pct}%`}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                )}
                {!results && c.description && <p className="muted result__desc">{c.description}</p>}
              </div>
            );
          })}
        </section>
      )}

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal__card">
            <h3 id="confirm-title">Confirm your vote</h3>
            <p>
              You are voting for <strong>{chosen && chosen.name}</strong>{chosen && chosen.party ? ` (${chosen.party})` : ''} in
              {' '}<strong>{election.title}</strong>. You cannot change it afterwards.
            </p>
            <div className="modal__actions">
              <button className="btn btn--outline" onClick={() => setConfirming(false)} disabled={busy}>Go back</button>
              <button className="btn btn--gold" onClick={castVote} disabled={busy}>{busy ? 'Submitting…' : 'Submit vote'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
