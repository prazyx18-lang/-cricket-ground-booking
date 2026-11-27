import { Link, useParams } from 'react-router-dom';
import { useStored } from '../hooks/useStored.js';
import { KEYS, DEFAULT_CONFIG } from '../lib/storage.js';
import { formatDate, formatDateTime, formatINR, formatRange } from '../lib/dates.js';
import { TYPE } from '../lib/bookingLogic.js';

export default function Confirmation() {
  const { bookingId } = useParams();
  const bookings = useStored(KEYS.bookings, []);
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <section className="section container narrow">
        <div className="card center-card">
          <h1>Booking not found</h1>
          <p className="muted">
            We could not find booking <strong>{bookingId}</strong> on this device. Bookings are saved in this browser
            only. If you booked from another device, use My Bookings with your mobile number.
          </p>
          <div className="hero-actions">
            <Link to="/my-bookings" className="btn btn-primary">
              Go to My Bookings
            </Link>
            <Link to="/book" className="btn btn-ghost">
              Book a slot
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isCancelled = booking.status !== 'confirmed';

  return (
    <section className="section container narrow">
      <div className={`card confirm-card ${isCancelled ? 'is-cancelled' : ''}`}>
        <div className="confirm-badge" aria-hidden="true">
          {isCancelled ? '✕' : '✓'}
        </div>
        <h1>{isCancelled ? 'This booking is cancelled' : 'Booking confirmed'}</h1>
        <p className="muted">
          Booking ID <strong className="booking-id">{booking.id}</strong>
        </p>

        <dl className="summary-list">
          <div>
            <dt>Customer</dt>
            <dd>{booking.customerName}</dd>
          </div>
          <div>
            <dt>Mobile</dt>
            <dd>{booking.phone}</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>{booking.teamName}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(booking.date)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {booking.slotLabel} · {formatRange(booking.start, booking.end)}
            </dd>
          </div>
          <div>
            <dt>Booking type</dt>
            <dd>{booking.type === TYPE.ENTIRE ? 'Entire ground (whole slot reserved)' : 'Single team (Team slot)'}</dd>
          </div>
          <div>
            <dt>Amount (demo)</dt>
            <dd>{formatINR(booking.amount)}</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{formatDateTime(booking.createdAt)}</dd>
          </div>
          {isCancelled && (
            <div>
              <dt>Refund (demo)</dt>
              <dd>{formatINR(booking.refundAmount ?? 0)}</dd>
            </div>
          )}
        </dl>

        {!isCancelled && (
          <>
            <h2 className="small-heading">What to do next</h2>
            <ul className="numbered">
              <li>Arrive 15 minutes before the slot begins.</li>
              <li>
                Share your booking ID with your team. {booking.type === TYPE.TEAM
                  ? 'The second team can join this slot until it is fully booked.'
                  : 'No other team can join this slot.'}
              </li>
              <li>
                Cancel online up to {config.cancellation.halfRefundHours} hours before the slot. Full refund if you cancel{' '}
                {config.cancellation.fullRefundHours}+ hours ahead.
              </li>
            </ul>
          </>
        )}

        <div className="hero-actions">
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            Print confirmation
          </button>
          <Link to={`/my-bookings?phone=${encodeURIComponent(booking.phone)}`} className="btn btn-primary">
            View my bookings
          </Link>
          <Link to="/book" className="btn btn-ghost">
            Book another slot
          </Link>
        </div>
      </div>
    </section>
  );
}
