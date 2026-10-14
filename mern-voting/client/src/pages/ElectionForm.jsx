import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { errMsg, toLocalInput } from '../utils.js';

const blankCandidate = () => ({ name: '', party: '', description: '' });

export default function ElectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [candidates, setCandidates] = useState([blankCandidate(), blankCandidate()]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/elections/${id}`)
      .then(({ data }) => {
        const e = data.election;
        setForm({
          title: e.title,
          description: e.description || '',
          startDate: toLocalInput(e.startDate),
          endDate: toLocalInput(e.endDate),
        });
        setCandidates(e.candidates.map((c) => ({ name: c.name, party: c.party || '', description: c.description || '' })));
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setCandidate = (i, key) => (e) =>
    setCandidates(candidates.map((c, idx) => (idx === i ? { ...c, [key]: e.target.value } : c)));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.startDate || !form.endDate) return setError('Choose the start and end date');

    const body = {
      title: form.title,
      description: form.description,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      candidates,
    };

    setBusy(true);
    try {
      if (editing) await api.put(`/elections/${id}`, body);
      else await api.post('/elections', body);
      navigate('/admin');
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="container"><p className="muted">Loading election…</p></main>;
  }

  return (
    <main className="container container--narrow">
      <Link to="/admin" className="back-link">Back to dashboard</Link>
      <div className="page-head">
        <h1>{editing ? 'Edit election' : 'New election'}</h1>
      </div>

      <form className="panel form" onSubmit={submit}>
        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={form.title} onChange={setField('title')} maxLength={120} required />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={3} value={form.description} onChange={setField('description')} maxLength={1000} />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="start">Voting opens</label>
            <input id="start" type="datetime-local" value={form.startDate} onChange={setField('startDate')} required />
          </div>
          <div className="field">
            <label htmlFor="end">Voting closes</label>
            <input id="end" type="datetime-local" value={form.endDate} onChange={setField('endDate')} required />
          </div>
        </div>

        <h2 className="form__sub">Candidates</h2>
        {candidates.map((c, i) => (
          <div className="cand" key={i}>
            <div className="cand__head">
              <strong>Candidate {i + 1}</strong>
              {candidates.length > 2 && (
                <button type="button" className="link link--danger" onClick={() => setCandidates(candidates.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor={`cn${i}`}>Name</label>
                <input id={`cn${i}`} value={c.name} onChange={setCandidate(i, 'name')} maxLength={60} required />
              </div>
              <div className="field">
                <label htmlFor={`cp${i}`}>Party or affiliation</label>
                <input id={`cp${i}`} value={c.party} onChange={setCandidate(i, 'party')} maxLength={60} />
              </div>
            </div>
            <div className="field">
              <label htmlFor={`cd${i}`}>Short bio</label>
              <input id={`cd${i}`} value={c.description} onChange={setCandidate(i, 'description')} maxLength={300} />
            </div>
          </div>
        ))}

        {candidates.length < 10 && (
          <button type="button" className="btn btn--outline" onClick={() => setCandidates([...candidates, blankCandidate()])}>
            Add candidate
          </button>
        )}

        <div className="form__actions">
          <Link to="/admin" className="btn btn--outline">Cancel</Link>
          <button className="btn btn--gold" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish election'}</button>
        </div>
      </form>
    </main>
  );
}
