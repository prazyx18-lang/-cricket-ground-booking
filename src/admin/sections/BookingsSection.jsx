import { useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useStored } from '../../hooks/useStored.js';
import { KEYS } from '../../lib/storage.js';
import { adminSlotLabel, cancelBooking, TYPE } from '../../lib/bookingLogic.js';
import { formatDate, formatDateTime, formatINR, formatRange, todayISO } from '../../lib/dates.js';

export default function BookingsSection() {
  const bookings = useStored(KEYS.bookings, []);
  const toast = useToast();
  const [filters, setFilters] = useState({ date: '', status: 'all', type: 'all', search: '' });
  const [toCancel, setToCancel] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return bookings
      .filter((b) => !filters.date || b.date === filters.date)
      .filter((b) => filters.status === 'all' || b.status === filters.status)
      .filter((b) => filters.type === 'all' || b.type === filters.type)
      .filter(
        (b) =>
          !q ||
          b.id.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.teamName.toLowerCase().includes(q)
      )
      // History view: most recently created first.
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bookings, filters]);

  const today = todayISO();
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const confirmCancel = () => {
    if (!toCancel || busy) return;
    setBusy(true);
    try {
      const updated = cancelBooking(toCancel.id, { byAdmin: true });
      toast.success(`Booking ${updated.id} cancelled with a full refund (demo).`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setToCancel(null);
    }
  };

  return (
    <>
      <section className="card admin-panel">
        <div className="filter-bar">
          <label className="filter">
            <span>Date</span>
            <input type="date" value={filters.date} onChange={setFilter('date')} />
          </label>
          <label className="filter">
            <span>Status</span>
            <select value={filters.status} onChange={setFilter('status')}>
              <option value="all">All (history)</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="filter">
            <span>Type</span>
            <select value={filters.type} onChange={setFilter('type')}>
              <option value="all">All types</option>
              <option value={TYPE.TEAM}>Team booking</option>
              <option value={TYPE.ENTIRE}>Entire ground</option>
            </select>
          </label>
          <label className="filter filter-grow">
            <span>Search</span>
            <input
              type="search"
              placeholder="Name, phone, team or ID"
              value={filters.search}
              onChange={setFilter('search')}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ date: '', status: 'all', type: 'all', search: '' })}
          >
            Clear filters
          </button>
        </div>
        <p className="muted small">
          Showing {rows.length} of {bookings.length} records. {filters.date && filters.date < today ? 'Past date.' : ''}
        </p>

        {rows.length === 0 ? (
          <p className="empty-state">No bookings match these filters.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Team</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Slot state</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className={b.status === 'cancelled' ? 'row-muted' : ''}>
                    <td className="mono">{b.id}</td>
                    <td>{b.customerName}</td>
                    <td>{b.phone}</td>
                    <td>{b.teamName}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>
                      {b.slotLabel}
                      <div className="muted tiny">{formatRange(b.start, b.end)}</div>
                    </td>
                    <td>
                      <span className={`type-pill ${b.type === TYPE.ENTIRE ? 'type-entire' : 'type-team'}`}>
                        {b.type === TYPE.ENTIRE ? 'Entire ground' : 'Team'}
                      </span>
                    </td>
                    <td>
                      <SlotStateCell booking={b} bookings={bookings} />
                    </td>
                    <td>
                      <span className={`status-pill ${b.status === 'confirmed' ? 'status-open' : 'status-blocked'}`}>
                        {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                      </span>
                    </td>
                    <td>{formatINR(b.amount)}</td>
                    <td className="muted tiny">{formatDateTime(b.createdAt)}</td>
                    <td>
                      {b.status === 'confirmed' && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setToCancel(b)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this booking?"
        message={
          toCancel
            ? `Admin cancellation for ${toCancel.customerName} (${toCancel.teamName}) on ${formatDate(toCancel.date)} releases the slot and refunds the full amount (demo).`
            : ''
        }
        confirmLabel="Cancel booking"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}

function SlotStateCell({ booking, bookings }) {
  const label = adminSlotLabel(booking, bookings);
  const cls =
    label === 'Fully booked'
      ? 'status-full'
      : label === '1 team needed'
        ? 'status-one_team'
        : label === 'Entire ground'
          ? 'status-entire'
          : 'status-blocked';
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
