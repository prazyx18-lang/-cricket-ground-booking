import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section container narrow">
      <div className="card center-card">
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <div className="hero-actions">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link to="/book" className="btn btn-ghost">
            Book a slot
          </Link>
        </div>
      </div>
    </section>
  );
}
