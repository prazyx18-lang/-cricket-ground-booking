import { Link } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback.jsx';
import { useStored } from '../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS } from '../lib/storage.js';
import { formatINR } from '../lib/dates.js';

const STEPS = [
  { title: 'Pick a date', text: 'Choose any day in the booking window from the calendar.' },
  { title: 'Choose a slot', text: 'Book one team, or reserve the entire ground for the slot.' },
  { title: 'Confirm instantly', text: 'Review your summary and get a booking ID right away.' },
];

export default function Home() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const [hero, ...rest] = config.photos;

  return (
    <>
      <section className="hero">
        <ImageWithFallback src={hero?.src} alt={hero?.alt || config.name} className="hero-media" eager />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="eyebrow">Premium cricket turf</span>
          <h1>{config.name}</h1>
          <p className="hero-lead">{config.tagline}</p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary btn-lg">
              Book a Slot
            </Link>
            <Link to="/ground" className="btn btn-outline btn-lg">
              Explore the Ground
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{config.openTime} – {config.closeTime}</strong>
              <span>Daily hours</span>
            </div>
            <div>
              <strong>{formatINR(config.teamPrice)}</strong>
              <span>Per team slot</span>
            </div>
            <div>
              <strong>{config.facilities.length}+</strong>
              <span>Facilities</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>How booking works</h2>
          <p className="muted">Two teams can share a slot. Or book the whole ground for yourself.</p>
        </div>
        <div className="grid-3">
          {STEPS.map((s, i) => (
            <article className="card step-card" key={s.title}>
              <span className="step-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Pricing</h2>
          <p className="muted">Simple per-slot pricing. Entire-ground bookings take the whole slot.</p>
        </div>
        <div className="grid-2">
          <article className="card price-card">
            <h3>Team slot</h3>
            <p className="price">{formatINR(config.teamPrice)}</p>
            <p className="muted">Per team, per slot. Two teams can share one slot.</p>
            <Link to="/book" className="btn btn-primary">
              Book a team slot
            </Link>
          </article>
          <article className="card price-card price-card-accent">
            <h3>Entire ground</h3>
            <p className="price">{formatINR(config.entireGroundPrice)}</p>
            <p className="muted">
              Reserves the whole slot. Only available when no team has booked that slot yet.
            </p>
            <Link to="/book" className="btn btn-outline">
              Reserve entire ground
            </Link>
          </article>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Gallery</h2>
          <p className="muted">A look at the turf, nets and pitch.</p>
        </div>
        <div className="gallery-grid">
          {rest.map((photo) => (
            <ImageWithFallback key={photo.src} src={photo.src} alt={photo.alt} className="gallery-item" />
          ))}
        </div>
        <div className="center-action">
          <Link to="/ground" className="btn btn-ghost">
            View full ground details
          </Link>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <div>
            <h2>Ready for your next match?</h2>
            <p className="muted">Pick a date, choose a slot and confirm in under a minute.</p>
          </div>
          <Link to="/book" className="btn btn-primary btn-lg">
            Book a Slot
          </Link>
        </div>
      </section>
    </>
  );
}
