import { useState } from 'react';

// Shows a shimmer while loading and a styled pitch illustration if the image fails.
export default function ImageWithFallback({ src, alt, className = '', eager = false }) {
  const [status, setStatus] = useState(src ? 'loading' : 'error');

  if (status === 'error') {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <svg viewBox="0 0 200 120" aria-hidden="true" className="img-fallback-art">
          <rect width="200" height="120" fill="#0f5132" />
          <rect x="20" y="10" width="160" height="100" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
          <line x1="100" y1="10" x2="100" y2="110" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
          <rect x="92" y="40" width="16" height="40" fill="#d9f99d" fillOpacity="0.85" />
        </svg>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <div className={`img-wrap ${className} ${status}`}>
      {status === 'loading' && <div className="skeleton" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}
