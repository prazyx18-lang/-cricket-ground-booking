import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStored } from '../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS } from '../lib/storage.js';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/ground', label: 'Ground Details' },
  { to: '/book', label: 'Book a Slot' },
  { to: '/my-bookings', label: 'My Bookings' },
];

export default function CustomerLayout() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="site">
      <header className="topbar">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label={`${config.name} home`}>
            <span className="brand-mark">CG</span>
            <span className="brand-name">{config.name}</span>
          </Link>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span className="bars" aria-hidden="true" />
          </button>

          <nav id="primary-nav" className={`nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                {item.label}
              </NavLink>
            ))}
            <Link to="/book" className="btn btn-primary btn-sm nav-cta">
              Book now
            </Link>
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <strong className="footer-title">{config.name}</strong>
            <p className="muted">{config.address}</p>
          </div>
          <div>
            <strong className="footer-title">Contact</strong>
            <p className="muted">{config.phone}</p>
            <p className="muted">{config.email}</p>
          </div>
          <div>
            <strong className="footer-title">Hours</strong>
            <p className="muted">
              Daily, {config.openTime} – {config.closeTime}
            </p>
            <Link to="/admin" className="footer-link">
              Admin login
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>Demo booking platform. No real payments are taken.</span>
        </div>
      </footer>
    </div>
  );
}
