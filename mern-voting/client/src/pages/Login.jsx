import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { errMsg } from '../utils.js';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      navigate('/verify', {
        state: { email: data.email, purpose: data.step === 'verify-register' ? 'register' : 'login' },
      });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={submit}>
        <h2>Sign in</h2>
        <p className="muted">Enter your details. We will email you a 6-digit code to confirm it is you.</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>

        <button className="btn btn--block" disabled={busy}>{busy ? 'Sending code…' : 'Continue'}</button>
        <p className="auth__switch">
          New voter? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
