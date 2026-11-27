import { useStored } from '../../hooks/useStored.js';
import { DEFAULT_SLOTS, KEYS } from '../../lib/storage.js';
import { computeStats, getSlotState, statusLabel } from '../../lib/bookingLogic.js';
import { formatINR, formatRange, todayISO, toMinutes } from '../../lib/dates.js';

export default function Overview() {
  const bookings = useStored(KEYS.bookings, []);
  const slotsCfg = useStored(KEYS.slots, DEFAULT_SLOTS);
  const stats = computeStats();
  const today = todayISO();
  const now = new Date();

  const todaySlots = [...slotsCfg.templates]
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((slot) => ({ slot, state: getSlotState(today, slot, { bookings, slotsCfg, now }) }));

  const cards = [
    { label: "Today's bookings", value: stats.todayBookings },
    { label: 'Total bookings', value: stats.totalBookings, sub: `${stats.cancelledBookings} cancelled` },
    { label: 'Available slots', value: stats.available, sub: `Next ${stats.windowDays} days, open for two teams` },
    { label: 'One team needed', value: stats.oneTeam, sub: 'One team booked, one spot open' },
    { label: 'Fully booked slots', value: stats.fullyBooked, sub: 'Both teams booked' },
    { label: 'Entire-ground bookings', value: stats.entireBookings, sub: 'Whole slot reserved' },
    { label: 'Team bookings', value: stats.teamBookings, sub: 'Single-team bookings' },
    { label: 'Demo revenue', value: formatINR(stats.revenue), sub: 'Confirmed bookings, no real payments' },
  ];

  return (
    <>
      <div className="stat-grid">
        {cards.map((c) => (
          <article className="card stat-card" key={c.label}>
            <span className="muted small">{c.label}</span>
            <strong className="stat-value">{c.value}</strong>
            {c.sub && <span className="muted tiny">{c.sub}</span>}
          </article>
        ))}
      </div>

      <section className="card admin-panel">
        <div className="card-head">
          <h2>Today's slot board</h2>
          <span className="muted small">Calculated from saved bookings</span>
        </div>
        {todaySlots.length === 0 ? (
          <p className="empty-state">No daily slots are configured. Add slots in the Slots section.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Teams</th>
              </tr>
            </thead>
            <tbody>
              {todaySlots.map(({ slot, state }) => (
                <tr key={slot.id}>
                  <td>{formatRange(slot.start, slot.end)}</td>
                  <td>{slot.label}</td>
                  <td>
                    <span className={`status-pill status-${state.status}`}>{statusLabel(state.status)}</span>
                  </td>
                  <td>
                    {state.entire
                      ? `Entire ground (${state.entire.customerName})`
                      : state.teams.length === 0
                        ? '—'
                        : state.teams.map((t) => t.teamName).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
