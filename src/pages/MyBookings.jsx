import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useStored } from '../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS } from '../lib/storage.js';
import { cancelBooking, normalizePhone, TYPE } from '../lib/bookingLogic.js';
import { formatDate, formatDateTime, formatINR, formatRange } from '../lib/dates.js';

export default function MyBookings() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const bookings = useStored(KEYS.bookings, []);
  const config = useStored(KEYS.config, DEFAULT_CONFIG);

  const [phoneInput, setPhoneInput] = useState(searchParams.get('phone') || '');
  const [lookup, setLookup] = useState(() => normalizePhone(searchParams.get('phone') || ''));
  const [phoneError, setPhoneError] = useState('');
  const [toCancel, setToCancel] = useState(null);
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => {
    if (!lookup) return [];
    return bookings
      .filter((b) => b.phone === lookup)
      .sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));
  }, [bookings, lookup]);

  const onSearch = (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phoneInput);
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      setPhoneError('Enter the 10-digit mobile number used for the booking.');
      return;
    }
    setPhoneError('');
    setLookup(normalized);
  };

  const confirmCancel = () => {
    if (!toCancel || busy) return;
    setBusy(true);
    try {
      const updated = cancelBooking(toCancel.id, { byAdmin: false });
      toast.success(
        `Booking ${updated.id} cancelled. Refund (demo): ${formatINR(updated.refundAmount)}.`
      );
      setToCancel(null);
    } catch (err) {
      toast.error(err.message);
      setToCancel(null);
    } finally {
      setBusy(false);
    }
  };

  const cancelRule = (booking) => {
    const hoursLeft = (new Date(`${booking.date}T${booking.start}:00`) - new Date()) / 3600000;
    const { fullRefundHours, halfRefundHours } = config.cancellation;
    if (hoursLeft <= 0) return { allowed: false, text: 'The slot has started. Cancellation is closed.' };
    if (hoursLeft < halfRefundHours) {
      return { allowed: false, text: `Online cancellation closes ${halfRefundHours} hours before the slot.` };
    }
    if (hoursLeft >= fullRefundHours) return { allowed: true, text: 'Full refund (demo) if cancelled now.' };
    return { allowed: true, text: '50% refund (demo) if cancelled now.' };
  };

  return (
    <>
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">My bookings</span>
          <h1>Find your bookings</h1>
          <p className="muted lead">Enter the mobile number you used when booking. This demo has no login.</p>
        </div>
      </section>

      <section className="section container narrow">
        <form className="card lookup-form" onSubmit={onSearch} noValidate>
          <label htmlFor="lookupPhone">Mobile number</label>
          <div className="lookup-row">
            <input
              id="lookupPhone"
              type="tel"
              inputMode="numeric"
              placeholder="e.g. 9000000001"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              aria-invalid={Boolean(phoneError)}
            />
            <button type="submit" className="btn btn-primary">
              Find bookings
            </button>
          </div>
          {phoneError && <span className="field-error">{phoneError}</span>}
        </form>

        {lookup && results.length === 0 && (
          <p className="empty-state">No bookings found for this number on this device.</p>
        )}

        <div className="booking-cards">
          {results.map((b) => {
            const rule = cancelRule(b);
            const confirmed = b.status === 'confirmed';
            return (
              <article className="card booking-card" key={b.id}>
                <div className="card-head">
                  <div>
                    <strong className="booking-id">{b.id}</strong>
                    <p className="muted small">Booked {formatDateTime(b.createdAt)}</p>
                  </div>
                  <span className={`status-pill ${confirmed ? 'status-open' : 'status-blocked'}`}>
                    {confirmed ? 'Confirmed' : 'Cancelled'}
                  </span>
                </div>
                <dl className="summary-list compact">
                  <div>
                    <dt>Date</dt>
                    <dd>{formatDate(b.date)}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>
                      {b.slotLabel} · {formatRange(b.start, b.end)}
                    </dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{b.type === TYPE.ENTIRE ? 'Entire ground' : 'Single team'}</dd>
                  </div>
                  <div>
                    <dt>Team</dt>
                    <dd>{b.teamName}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{formatINR(b.amount)}</dd>
                  </div>
                  {!confirmed && (
                    <div>
                      <dt>Refund (demo)</dt>
                      <dd>{formatINR(b.refundAmount ?? 0)}</dd>
                    </div>
                  )}
                </dl>

                {confirmed && (
                  <div className="booking-card-foot">
                    <p className="muted small">{rule.text}</p>
                    <div className="booking-card-actions">
                      <Link to={`/confirmation/${b.id}`} className="btn btn-ghost btn-sm">
                        View details
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={!rule.allowed}
                        onClick={() => setToCancel(b)}
                      >
                        Cancel booking
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this booking?"
        message={
          toCancel
            ? `Booking ${toCancel.id} on ${formatDate(toCancel.date)} (${formatRange(toCancel.start, toCancel.end)}) will be cancelled. ${
                toCancel.type === TYPE.ENTIRE
                  ? 'The whole slot will reopen for others.'
                  : 'Your team spot will reopen for another team.'
              }`
            : ''
        }
        confirmLabel="Yes, cancel booking"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}
