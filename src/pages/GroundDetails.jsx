import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback.jsx';
import { useStored } from '../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS } from '../lib/storage.js';
import { formatINR } from '../lib/dates.js';

export default function GroundDetails() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`;

  return (
    <>
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Ground details</span>
          <h1>{config.name}</h1>
          <p className="muted lead">{config.tagline}</p>
        </div>
      </section>

      <section className="section container">
        <div className="gallery-grid gallery-large">
          {config.photos.map((photo, i) => (
            <button
              type="button"
              key={photo.src}
              className="gallery-button"
              onClick={() => setLightbox(i)}
              aria-label={`Open photo: ${photo.alt}`}
            >
              <ImageWithFallback src={photo.src} alt={photo.alt} className="gallery-item" />
            </button>
          ))}
        </div>
      </section>

      <section className="section container details-grid">
        <article className="card">
          <h2>Location & contact</h2>
          <p>{config.address}</p>
          <p className="muted">Phone: {config.phone}</p>
          <p className="muted">Email: {config.email}</p>
          <a className="btn btn-outline" href={mapsUrl} target="_blank" rel="noreferrer">
            Get directions
          </a>
        </article>

        <article className="card">
          <h2>Timings & pricing</h2>
          <ul className="info-list">
            <li>
              <span>Operating hours</span>
              <strong>
                {config.openTime} – {config.closeTime}
              </strong>
            </li>
            <li>
              <span>Team slot</span>
              <strong>{formatINR(config.teamPrice)}</strong>
            </li>
            <li>
              <span>Entire ground</span>
              <strong>{formatINR(config.entireGroundPrice)}</strong>
            </li>
            <li>
              <span>Bookings open</span>
              <strong>Up to {config.bookingWindowDays} days ahead</strong>
            </li>
          </ul>
        </article>

        <article className="card card-wide">
          <h2>Facilities</h2>
          <ul className="chip-list">
            {config.facilities.map((f) => (
              <li key={f} className="chip">
                ✓ {f}
              </li>
            ))}
          </ul>
        </article>

        <article className="card card-wide">
          <h2>Booking instructions</h2>
          <ol className="numbered">
            {config.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </article>

        <article className="card card-wide">
          <h2>Cancellation policy</h2>
          <ul className="info-list">
            <li>
              <span>Cancel {config.cancellation.fullRefundHours}+ hours before the slot</span>
              <strong>Full refund (demo)</strong>
            </li>
            <li>
              <span>
                Cancel {config.cancellation.halfRefundHours}–{config.cancellation.fullRefundHours} hours before
              </span>
              <strong>50% refund (demo)</strong>
            </li>
            <li>
              <span>Less than {config.cancellation.halfRefundHours} hours before</span>
              <strong>Online cancellation closed</strong>
            </li>
          </ul>
          <div className="center-action">
            <Link to="/book" className="btn btn-primary">
              Book a slot
            </Link>
          </div>
        </article>
      </section>

      {lightbox !== null && (
        <div className="modal-backdrop lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback
              src={config.photos[lightbox].src}
              alt={config.photos[lightbox].alt}
              className="lightbox-image"
            />
            <div className="lightbox-nav">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setLightbox((lightbox - 1 + config.photos.length) % config.photos.length)}
              >
                ‹ Previous
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setLightbox(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setLightbox((lightbox + 1) % config.photos.length)}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
