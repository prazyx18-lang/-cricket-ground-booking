import { useState } from 'react';
import { getAdmin } from '../lib/storage.js';

// Demo-only credential check against localStorage. Not a security boundary.
export default function AdminLogin({ onLogin, backLink }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError('Enter both username and password.');
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      const admin = getAdmin();
      if (username.trim() === admin.username && password === admin.password) {
        onLogin();
      } else {
        setError('Invalid username or password.');
        setBusy(false);
      }
    }, 350);
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="brand-mark brand-mark-lg">CG</div>
        <h1>Admin login</h1>
        <p className="muted small">Sign in to manage bookings, slots and demo data.</p>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="adminUser">Username</label>
            <input id="adminUser" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="adminPass">Password</label>
            <input
              id="adminPass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="notice notice-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="muted tiny demo-creds">
          Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
        </p>
        {backLink}
      </div>
    </div>
  );
}
