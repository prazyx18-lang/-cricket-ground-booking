import { useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Calendar from '../../components/Calendar.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useStored } from '../../hooks/useStored.js';
import { DEFAULT_CONFIG, DEFAULT_SLOTS, KEYS } from '../../lib/storage.js';
import {
  addSlot,
  deleteSlot,
  getSlotState,
  statusLabel,
  toggleBlock,
  updateSlot,
  bookingsForSlot,
} from '../../lib/bookingLogic.js';
import { formatDate, formatRange, todayISO, toMinutes } from '../../lib/dates.js';

const EMPTY_SLOT = { label: '', start: '', end: '' };

export default function SlotsSection() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const slotsCfg = useStored(KEYS.slots, DEFAULT_SLOTS);
  const bookings = useStored(KEYS.bookings, []);
  const toast = useToast();

  const [newSlot, setNewSlot] = useState(EMPTY_SLOT);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY_SLOT);
  const [toDelete, setToDelete] = useState(null);
  const [blockDate, setBlockDate] = useState(todayISO());

  const sorted = useMemo(
    () => [...slotsCfg.templates].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [slotsCfg]
  );

  const submitNew = (e) => {
    e.preventDefault();
    try {
      addSlot(newSlot);
      toast.success('Daily slot added. It now appears for every selectable date.');
      setNewSlot(EMPTY_SLOT);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveEdit = (id) => {
    try {
      updateSlot(id, editDraft);
      toast.success('Slot updated.');
      setEditingId(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    try {
      deleteSlot(toDelete.id);
      toast.success(`Slot "${toDelete.label}" deleted.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToDelete(null);
    }
  };

  const onToggleBlock = (slotId, label) => {
    const blocked = toggleBlock(blockDate, slotId);
    toast.info(`${label} on ${formatDate(blockDate)} is now ${blocked ? 'blocked' : 'unblocked'}.`);
  };

  const dayStates = sorted.map((slot) => ({
    slot,
    state: getSlotState(blockDate, slot, { bookings, slotsCfg, now: new Date() }),
    count: bookingsForSlot(bookings, blockDate, slot.id).length,
  }));

  return (
    <>
      <section className="card admin-panel">
        <div className="card-head">
          <h2>Daily slot templates</h2>
          <span className="muted small">
            Applied to every date. Operating hours {config.openTime}–{config.closeTime}.
          </span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Start</th>
                <th>End</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((slot) =>
                editingId === slot.id ? (
                  <tr key={slot.id}>
                    <td>
                      <input
                        aria-label="Slot label"
                        value={editDraft.label}
                        onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Start time"
                        type="time"
                        value={editDraft.start}
                        onChange={(e) => setEditDraft({ ...editDraft, start: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="End time"
                        type="time"
                        value={editDraft.end}
                        onChange={(e) => setEditDraft({ ...editDraft, end: e.target.value })}
                      />
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(slot.id)}>
                        Save
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={slot.id}>
                    <td>{slot.label}</td>
                    <td>{slot.start}</td>
                    <td>{slot.end}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setEditingId(slot.id);
                          setEditDraft({ label: slot.label, start: slot.start, end: slot.end });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(slot)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <form className="inline-form" onSubmit={submitNew}>
          <h3>Add a daily slot</h3>
          <div className="inline-fields">
            <label>
              <span>Label</span>
              <input
                value={newSlot.label}
                onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
                placeholder="e.g. Evening"
                maxLength={30}
              />
            </label>
            <label>
              <span>Start</span>
              <input type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} />
            </label>
            <label>
              <span>End</span>
              <input type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} />
            </label>
            <button type="submit" className="btn btn-primary">
              Add slot
            </button>
          </div>
          <p className="muted tiny">Slots cannot overlap each other or fall outside operating hours.</p>
        </form>
      </section>

      <section className="card admin-panel">
        <div className="card-head">
          <h2>Block or unblock slots by date</h2>
          <span className="muted small">Blocked slots cannot be booked by customers.</span>
        </div>
        <div className="block-layout">
          <Calendar value={blockDate} onChange={setBlockDate} windowDays={365} />
          <div className="block-list">
            <h3>{formatDate(blockDate)}</h3>
            <ul className="unavailable-list">
              {dayStates.map(({ slot, state, count }) => (
                <li key={slot.id}>
                  <span>
                    <strong>{formatRange(slot.start, slot.end)}</strong> · {slot.label}
                    <span className="muted tiny block-meta">
                      {count > 0 ? ` · ${count} booking${count > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                  <span className="row-actions">
                    <span className={`status-pill status-${state.status}`}>{statusLabel(state.status)}</span>
                    {state.status !== 'past' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onToggleBlock(slot.id, slot.label)}
                      >
                        {state.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {dayStates.length === 0 && <p className="empty-state">No daily slots yet.</p>}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this slot?"
        message={
          toDelete
            ? `"${toDelete.label}" (${formatRange(toDelete.start, toDelete.end)}) will be removed from every date. Slots with upcoming bookings cannot be deleted.`
            : ''
        }
        confirmLabel="Delete slot"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
