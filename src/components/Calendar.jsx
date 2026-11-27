import { useState } from 'react';
import { addDays, monthKey, pad, parseISODate, toISODate, todayISO } from '../lib/dates.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Selectable range: today through bookingWindowDays ahead. Past and out-of-window dates are disabled.
export default function Calendar({ value, onChange, windowDays }) {
  const today = todayISO();
  const maxDate = addDays(today, windowDays);
  const [cursor, setCursor] = useState(() => monthKey(value || today));

  const [year, month] = cursor.split('-').map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = firstOfMonth.getDay();
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const monthLabel = firstOfMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const canGoPrev = cursor > monthKey(today);
  const canGoNext = cursor < monthKey(maxDate);

  const shiftMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setCursor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} disabled={!canGoPrev} aria-label="Previous month">
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} disabled={!canGoNext} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, idx) => {
          if (day === null) return <span key={`blank-${idx}`} />;
          const iso = toISODate(new Date(year, month - 1, day));
          const disabled = iso < today || iso > maxDate;
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              className={`calendar-day ${selected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${parseISODate(iso).toDateString()}${disabled ? ' (not available)' : ''}`}
              onClick={() => onChange(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="calendar-note">Bookings open up to {windowDays} days ahead. Past dates cannot be booked.</p>
    </div>
  );
}
