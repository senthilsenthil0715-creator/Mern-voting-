import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { errMsg } from '../utils.js';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/verify', { state: { email: data.email, purpose: 'register' } });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={submit}>
        <h2>Create your voter account</h2>
        <p className="muted">We will email a code to verify your address before you can vote.</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={set('name')} autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} required />
          <small className="hint">At least 8 characters</small>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        </div>

        <button className="btn btn--block" disabled={busy}>{busy ? 'Sending code…' : 'Create account'}</button>
        <p className="auth__switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
