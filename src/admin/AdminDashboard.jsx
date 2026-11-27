import { useState } from 'react';
import { Link } from 'react-router-dom';
import Overview from './sections/Overview.jsx';
import BookingsSection from './sections/BookingsSection.jsx';
import SlotsSection from './sections/SlotsSection.jsx';
import SettingsSection from './sections/SettingsSection.jsx';
import { useStored } from '../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS } from '../lib/storage.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings & history' },
  { id: 'slots', label: 'Slots & availability' },
  { id: 'settings', label: 'Settings & demo data' },
];

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('overview');
  const config = useStored(KEYS.config, DEFAULT_CONFIG);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">CG</span>
          <span className="brand-name">{config.name}</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-nav-item ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn btn-ghost btn-block" onClick={onLogout}>
          Log out
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
            <p className="muted small">Changes here update the customer website immediately.</p>
          </div>
        </header>

        {tab === 'overview' && <Overview />}
        {tab === 'bookings' && <BookingsSection />}
        {tab === 'slots' && <SlotsSection />}
        {tab === 'settings' && <SettingsSection />}
      </main>
    </div>
  );
}
