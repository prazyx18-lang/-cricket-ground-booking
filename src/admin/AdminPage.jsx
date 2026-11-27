import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import { SESSION_KEY } from '../lib/storage.js';

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => window.sessionStorage.getItem(SESSION_KEY) === '1');

  if (!authed) {
    return (
      <AdminLogin
        onLogin={() => {
          window.sessionStorage.setItem(SESSION_KEY, '1');
          setAuthed(true);
        }}
        backLink={<Link to="/" className="back-link">← Back to website</Link>}
      />
    );
  }

  return (
    <AdminDashboard
      onLogout={() => {
        window.sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
      }}
    />
  );
}
