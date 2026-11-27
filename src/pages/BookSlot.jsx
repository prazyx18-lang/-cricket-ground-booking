import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Calendar from '../components/Calendar.jsx';
import { useStored } from '../hooks/useStored.js';
import { useToast } from '../context/ToastContext.jsx';
import { DEFAULT_CONFIG, DEFAULT_SLOTS, KEYS } from '../lib/storage.js';
import {
  TYPE,
  STATUS,
  createBooking,
  entireUnavailableReason,
  getSlotState,
  isSelectableDate,
  teamUnavailableReason,
  validateCustomer,
} from '../lib/bookingLogic.js';
import { formatDate, formatINR, formatRange, todayISO, toMinutes } from '../lib/dates.js';

const EMPTY_FORM = { customerName: '', phone: '', teamName: '' };

export default function BookSlot() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const slotsCfg = useStored(KEYS.slots, DEFAULT_SLOTS);
  const bookings = useStored(KEYS.bookings, []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const requested = searchParams.get('date');
  const [date, setDate] = useState(() => (isSelectableDate(requested, config) ? requested : todayISO()));
  const [now, setNow] = useState(() => new Date());
  const [selection, setSelection] = useState(null); // { slotId, type }
  const [step, setStep] = useState('pick'); // pick | details | summary
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  // Re-evaluate past slots every 30 seconds so slots lapse without a reload.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const slots = useMemo(
    () => [...slotsCfg.templates].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [slotsCfg]
  );

  const states = slots.map((slot) => ({
    slot,
    state: getSlotState(date, slot, { bookings, slotsCfg, now }),
  }));

  const bookable = states.filter(({ state }) => state.canBookTeam || state.canBookEntire);
  const unavailable = states.filter(({ state }) => !state.canBookTeam && !state.canBookEntire);

  const selected = selection ? states.find((x) => x.slot.id === selection.slotId) : null;
  const selectedStatus = selected?.state.status;

  // If another customer takes the slot while this person is mid-flow, reset the panel and explain why.
  useEffect(() => {
    if (!selection || !selected) return;
    const stillValid =
      selection.type === TYPE.TEAM ? selected.state.canBookTeam : selected.state.canBookEntire;
    if (!stillValid) {
      setSelection(null);
      setStep('pick');
      setForm(EMPTY_FORM);
      setErrors({});
      toast.info('That slot was just updated by another booking. Please choose again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, selectedStatus]);

  const changeDate = (iso) => {
    setDate(iso);
    setSelection(null);
    setStep('pick');
    setErrors({});
  };

  const startBooking = (slotId, type) => {
    setSelection({ slotId, type });
    setStep('details');
    setErrors({});
    setForm(EMPTY_FORM);
  };

  const cancelSelection = () => {
    setSelection(null);
    setStep('pick');
    setErrors({});
  };

  const continueToSummary = (e) => {
    e.preventDefault();
    const { errors: found } = validateCustomer(form);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep('summary');
  };

  const confirmBooking = () => {
    if (submitLock.current || !selection) return;
    submitLock.current = true;
    setSubmitting(true);
    // Short delay gives loading feedback and prevents accidental double submission.
    window.setTimeout(() => {
      try {
        const booking = createBooking({ date, slotId: selection.slotId, type: selection.type, customer: form });
        toast.success(`Booking confirmed. Your ID is ${booking.id}.`);
        navigate(`/confirmation/${booking.id}`);
      } catch (err) {
        toast.error(err.message);
        cancelSelection();
      } finally {
        submitLock.current = false;
        setSubmitting(false);
      }
    }, 450);
  };

  const selectedSlot = selected?.slot;
  const amount = selection
    ? selection.type === TYPE.ENTIRE
      ? config.entireGroundPrice
      : config.teamPrice
    : 0;

  return (
    <>
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Book a slot</span>
          <h1>Choose your date and slot</h1>
          <p className="muted lead">
            Each slot supports two teams. Book a single team, or reserve the entire ground when no team has joined yet.
          </p>
        </div>
      </section>

      <section className="section container booking-layout">
        <div className="booking-main">
          <Calendar value={date} onChange={changeDate} windowDays={config.bookingWindowDays} />

          <div className="card">
            <div className="card-head">
              <h2>Slots for {formatDate(date)}</h2>
              <span className="muted small">
                {slots.length} daily slots · {config.openTime}–{config.closeTime}
              </span>
            </div>

            {bookable.length === 0 && (
              <p className="empty-state">No slots are open for this date. Try another day.</p>
            )}

            <div className="slot-list">
              {bookable.map(({ slot, state }) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  state={state}
                  active={selection?.slotId === slot.id}
                  onBookTeam={() => startBooking(slot.id, TYPE.TEAM)}
                  onBookEntire={() => startBooking(slot.id, TYPE.ENTIRE)}
                />
              ))}
            </div>

            {unavailable.length > 0 && (
              <div className="unavailable">
                <h3>Not available for booking</h3>
                <ul className="unavailable-list">
                  {unavailable.map(({ slot, state }) => (
                    <li key={slot.id}>
                      <span>
                        <strong>{formatRange(slot.start, slot.end)}</strong> · {slot.label}
                      </span>
                      <span className={`status-pill status-${state.status}`}>{state.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="booking-panel card" aria-live="polite">
          {!selection && (
            <div className="panel-empty">
              <h2>Your booking</h2>
              <p className="muted">
                Select <strong>Book a Slot</strong> to join as a team, or <strong>Book Entire Ground</strong> to reserve
                the whole slot.
              </p>
              <ul className="rule-list">
                <li>A slot with one team shows <strong>1 Team Needed</strong>. Another team can still join.</li>
                <li>When two teams have booked, the slot is <strong>Fully Booked</strong>.</li>
                <li>
                  Entire-ground booking is only possible when <em>no team</em> has booked the slot. It blocks all team
                  bookings for that slot.
                </li>
              </ul>
            </div>
          )}

          {selection && selectedSlot && step === 'details' && (
            <form className="booking-form" onSubmit={continueToSummary} noValidate>
              <h2>{selection.type === TYPE.ENTIRE ? 'Entire ground booking' : 'Team booking'}</h2>
              <p className="muted small">
                {formatDate(date)} · {selectedSlot.label} · {formatRange(selectedSlot.start, selectedSlot.end)}
              </p>
              {selection.type === TYPE.ENTIRE && (
                <p className="notice notice-info">
                  This reserves the whole slot. No other team can book it while the reservation stands.
                </p>
              )}
              {selection.type === TYPE.TEAM && selected.state.teamsBooked === 1 && (
                <p className="notice notice-info">
                  Team A is already booked for this slot. You are joining as Team B.
                </p>
              )}

              <Field
                label="Customer name"
                id="customerName"
                value={form.customerName}
                error={errors.customerName}
                onChange={(v) => setForm({ ...form, customerName: v })}
                autoComplete="name"
              />
              <Field
                label="Mobile number"
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={form.phone}
                error={errors.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                autoComplete="tel"
                maxLength={16}
              />
              <Field
                label="Team name"
                id="teamName"
                value={form.teamName}
                error={errors.teamName}
                onChange={(v) => setForm({ ...form, teamName: v })}
                maxLength={40}
              />

              <div className="panel-actions">
                <button type="button" className="btn btn-ghost" onClick={cancelSelection}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Review summary
                </button>
              </div>
            </form>
          )}

          {selection && selectedSlot && step === 'summary' && (
            <div className="booking-summary">
              <h2>Booking summary</h2>
              <dl className="summary-list">
                <div>
                  <dt>Date</dt>
                  <dd>{formatDate(date)}</dd>
                </div>
                <div>
                  <dt>Slot</dt>
                  <dd>
                    {selectedSlot.label} · {formatRange(selectedSlot.start, selectedSlot.end)}
                  </dd>
                </div>
                <div>
                  <dt>Booking type</dt>
                  <dd>{selection.type === TYPE.ENTIRE ? 'Entire ground' : 'Single team'}</dd>
                </div>
                <div>
                  <dt>Customer</dt>
                  <dd>{form.customerName.trim()}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{form.phone.trim()}</dd>
                </div>
                <div>
                  <dt>Team</dt>
                  <dd>{form.teamName.trim()}</dd>
                </div>
                <div className="summary-total">
                  <dt>Amount (demo, no payment taken)</dt>
                  <dd>{formatINR(amount)}</dd>
                </div>
              </dl>
              <div className="panel-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep('details')} disabled={submitting}>
                  Edit details
                </button>
                <button type="button" className="btn btn-primary" onClick={confirmBooking} disabled={submitting}>
                  {submitting && <span className="spinner" aria-hidden="true" />}
                  {submitting ? 'Confirming…' : 'Confirm booking'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

function SlotCard({ slot, state, active, onBookTeam, onBookEntire }) {
  const teamHint =
    state.status === STATUS.ONE_TEAM
      ? `Team A: ${state.teams[0].teamName} is booked. ${state.teamsRemaining} team spot left.`
      : 'Both team spots are open.';

  return (
    <article className={`slot-card ${active ? 'is-active' : ''}`}>
      <div className="slot-info">
        <div className="slot-time">{formatRange(slot.start, slot.end)}</div>
        <div className="slot-label">{slot.label}</div>
        <span className={`status-pill status-${state.status}`}>{state.label}</span>
        <p className="muted small slot-hint">{teamHint}</p>
      </div>
      <div className="slot-actions">
        {state.canBookTeam ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onBookTeam}>
            {state.status === STATUS.ONE_TEAM ? 'Join as Team B' : 'Book a Slot'}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" disabled title={teamUnavailableReason(state)}>
            Book a Slot
          </button>
        )}
        {state.canBookEntire ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={onBookEntire}>
            Book Entire Ground
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" disabled title={entireUnavailableReason(state)}>
            Book Entire Ground
          </button>
        )}
        {!state.canBookEntire && (
          <p className="muted tiny">{entireUnavailableReason(state)}</p>
        )}
      </div>
    </article>
  );
}

function Field({ label, id, error, onChange, value, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
