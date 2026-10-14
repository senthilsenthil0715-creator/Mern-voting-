import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../utils.js';
import AuthLayout from '../components/AuthLayout.jsx';
import OtpInput from '../components/OtpInput.jsx';

export default function VerifyOtp() {
  const { state } = useLocation();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!state || !state.email || !state.purpose) return <Navigate to="/login" replace />;
  const { email, purpose } = state;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const endpoint = purpose === 'register' ? '/auth/verify-register' : '/auth/verify-login';
      const { data } = await api.post(endpoint, { email, otp: code });
      login(data); // the Guest route then redirects to the dashboard
    } catch (err) {
      setError(errMsg(err));
      setCode('');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    try {
      await api.post('/auth/resend-otp', { email, purpose });
      setInfo('A new code is on its way.');
      setCode('');
      setCooldown(30);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={submit}>
        <h2>Check your email</h2>
        <p className="muted">
          We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.
        </p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}
        {info && <div className="alert alert--success" role="status">{info}</div>}

        <OtpInput value={code} onChange={setCode} disabled={busy} />

        <button className="btn btn--block" disabled={busy || code.length !== 6}>
          {busy ? 'Verifying…' : purpose === 'register' ? 'Verify and create account' : 'Verify and sign in'}
        </button>

        <div className="auth__resend">
          {cooldown > 0 ? (
            <span className="muted">Resend code in {cooldown}s</span>
          ) : (
            <button type="button" className="link" onClick={resend}>Resend code</button>
          )}
          <Link to="/login">Use a different account</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
