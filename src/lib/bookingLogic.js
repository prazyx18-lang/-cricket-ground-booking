// Central booking rules. UI components call these functions and never re-implement the rules.
// Availability is always derived from saved booking records, never from hardcoded labels.
import {
  getBookings,
  setBookings,
  getSlots,
  setSlots,
  getConfig,
  getCustomers,
  setCustomers,
  setConfig,
} from './storage.js';
import {
  addDays,
  isValidISODate,
  isValidTime,
  rangesOverlap,
  slotStartDateTime,
  todayISO,
  toMinutes,
} from './dates.js';

export const TYPE = { TEAM: 'team', ENTIRE: 'entire' };
export const MAX_TEAMS_PER_SLOT = 2;

export const STATUS = {
  BLOCKED: 'blocked',
  PAST: 'past',
  OPEN: 'open',
  ONE_TEAM: 'one_team',
  FULL: 'full',
  ENTIRE: 'entire',
};

const STATUS_LABEL = {
  [STATUS.BLOCKED]: 'Unavailable',
  [STATUS.PAST]: 'Time passed',
  [STATUS.OPEN]: 'Available',
  [STATUS.ONE_TEAM]: '1 Team Needed',
  [STATUS.FULL]: 'Fully Booked',
  [STATUS.ENTIRE]: 'Entire Ground Reserved',
};

export const statusLabel = (status) => STATUS_LABEL[status] || status;

export class BookingError extends Error {}

// ---------- Input validation ----------

export function normalizePhone(raw = '') {
  let digits = String(raw).replace(/[\s\-()]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

const PHONE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^\p{L}[\p{L} .'-]{1,59}$/u;
const TEAM_RE = /^[\p{L}\p{N}][\p{L}\p{N} .&'-]{1,39}$/u;

export function validateCustomer({ customerName = '', phone = '', teamName = '' }) {
  const name = customerName.trim().replace(/\s+/g, ' ');
  const team = teamName.trim().replace(/\s+/g, ' ');
  const normalized = normalizePhone(phone);
  const errors = {};
  if (!NAME_RE.test(name)) errors.customerName = 'Enter a valid name (letters only, 2–60 characters).';
  if (!PHONE_RE.test(normalized)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (!TEAM_RE.test(team)) errors.teamName = 'Enter a team name (2–40 characters).';
  return { errors, value: { customerName: name, phone: normalized, teamName: team } };
}

// ---------- Date and slot rules ----------

export function isSelectableDate(date, config = getConfig()) {
  const today = todayISO();
  return isValidISODate(date) && date >= today && date <= addDays(today, config.bookingWindowDays);
}

export function hasStarted(date, slot, now = new Date()) {
  return slotStartDateTime(date, slot.start) <= now;
}

export function isBlocked(slotsCfg, date, slotId) {
  return slotsCfg.blocks.some((b) => b.date === date && b.slotId === slotId);
}

export function bookingsForSlot(bookings, date, slotId) {
  return bookings.filter((b) => b.status === 'confirmed' && b.date === date && b.slotId === slotId);
}

// Single source of truth for what a customer can do with a slot on a date.
export function getSlotState(date, slot, { bookings = getBookings(), slotsCfg = getSlots(), now = new Date() } = {}) {
  const active = bookingsForSlot(bookings, date, slot.id);
  const entire = active.find((b) => b.type === TYPE.ENTIRE) || null;
  const teams = active.filter((b) => b.type === TYPE.TEAM);

  let status;
  if (hasStarted(date, slot, now)) status = STATUS.PAST;
  else if (isBlocked(slotsCfg, date, slot.id)) status = STATUS.BLOCKED;
  else if (entire) status = STATUS.ENTIRE;
  else if (teams.length >= MAX_TEAMS_PER_SLOT) status = STATUS.FULL;
  else if (teams.length === 1) status = STATUS.ONE_TEAM;
  else status = STATUS.OPEN;

  return {
    status,
    label: statusLabel(status),
    entire,
    teams,
    teamsBooked: teams.length,
    teamsRemaining: entire ? 0 : Math.max(0, MAX_TEAMS_PER_SLOT - teams.length),
    canBookTeam: status === STATUS.OPEN || status === STATUS.ONE_TEAM,
    canBookEntire: status === STATUS.OPEN,
  };
}

export function teamUnavailableReason(state) {
  switch (state.status) {
    case STATUS.ENTIRE: return 'This slot is reserved for an entire-ground booking.';
    case STATUS.FULL: return 'This slot is fully booked. Both teams have already joined.';
    case STATUS.BLOCKED: return 'This slot is closed by the ground.';
    case STATUS.PAST: return 'This slot has already started.';
    default: return '';
  }
}

export function entireUnavailableReason(state) {
  switch (state.status) {
    case STATUS.ENTIRE: return 'The entire ground is already reserved for this slot.';
    case STATUS.ONE_TEAM:
    case STATUS.FULL:
      return 'Entire-ground booking is only possible when no team has booked this slot. A team has already booked it.';
    case STATUS.BLOCKED: return 'This slot is closed by the ground.';
    case STATUS.PAST: return 'This slot has already started.';
    default: return '';
  }
}

// ---------- Bookings ----------

function newBookingId(existing) {
  const used = new Set(existing.map((b) => b.id));
  let id;
  do {
    id = `CGB-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  } while (used.has(id));
  return id;
}

function upsertCustomer(booking) {
  const list = getCustomers();
  const idx = list.findIndex((c) => c.phone === booking.phone);
  const entry = {
    phone: booking.phone,
    name: booking.customerName,
    teamName: booking.teamName,
    createdAt: idx >= 0 ? list[idx].createdAt : booking.createdAt,
    lastBookingAt: booking.createdAt,
  };
  setCustomers(idx >= 0 ? list.map((c, i) => (i === idx ? entry : c)) : [...list, entry]);
}

export function createBooking({ date, slotId, type, customer }, { now = new Date() } = {}) {
  const config = getConfig();
  const slotsCfg = getSlots();

  if (type !== TYPE.TEAM && type !== TYPE.ENTIRE) throw new BookingError('Choose a booking type.');
  if (!isValidISODate(date)) throw new BookingError('Choose a valid date.');
  if (!isSelectableDate(date, config)) {
    throw new BookingError(`Bookings are open from today up to ${config.bookingWindowDays} days ahead.`);
  }

  const slot = slotsCfg.templates.find((s) => s.id === slotId);
  if (!slot) throw new BookingError('This slot is no longer available. Please refresh and choose another.');
  if (hasStarted(date, slot, now)) throw new BookingError('This slot has already started. Please choose a later slot.');

  const { errors, value } = validateCustomer(customer || {});
  const firstError = Object.values(errors)[0];
  if (firstError) throw new BookingError(firstError);

  const bookings = getBookings();
  const state = getSlotState(date, slot, { bookings, slotsCfg, now });

  if (type === TYPE.ENTIRE && !state.canBookEntire) throw new BookingError(entireUnavailableReason(state));
  if (type === TYPE.TEAM && !state.canBookTeam) throw new BookingError(teamUnavailableReason(state));

  const duplicate = state.teams.find(
    (b) => b.phone === value.phone || b.teamName.toLowerCase() === value.teamName.toLowerCase()
  );
  if (duplicate) throw new BookingError('This team or phone number has already booked this slot.');

  const overlap = bookings.find(
    (b) => b.status === 'confirmed' && b.date === date && b.phone === value.phone && rangesOverlap(b, slot)
  );
  if (overlap) throw new BookingError('You already have a booking that overlaps this time.');

  const booking = {
    id: newBookingId(bookings),
    status: 'confirmed',
    date,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    slotLabel: slot.label,
    type,
    customerName: value.customerName,
    phone: value.phone,
    teamName: value.teamName,
    amount: type === TYPE.ENTIRE ? config.entireGroundPrice : config.teamPrice,
    createdAt: now.toISOString(),
  };

  setBookings([...bookings, booking]);
  upsertCustomer(booking);
  return booking;
}

// Customer cancellations follow the refund policy in config. Admin cancellations always refund in full.
export function cancelBooking(id, { byAdmin = false, now = new Date() } = {}) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new BookingError('Booking not found.');

  const booking = bookings[idx];
  if (booking.status !== 'confirmed') throw new BookingError('This booking is already cancelled.');

  let refundRate = 1;
  if (!byAdmin) {
    const { fullRefundHours, halfRefundHours } = getConfig().cancellation;
    const hours = (slotStartDateTime(booking.date, booking.start) - now) / 3600000;
    if (hours <= 0) throw new BookingError('This slot has already started and cannot be cancelled.');
    if (hours < halfRefundHours) {
      throw new BookingError(
        `Online cancellation closes ${halfRefundHours} hours before the slot starts. Please contact the ground.`
      );
    }
    refundRate = hours >= fullRefundHours ? 1 : 0.5;
  }

  const updated = {
    ...booking,
    status: 'cancelled',
    cancelledAt: now.toISOString(),
    cancelledBy: byAdmin ? 'admin' : 'customer',
    refundAmount: Math.round(booking.amount * refundRate),
  };
  setBookings(bookings.map((b, i) => (i === idx ? updated : b)));
  return updated;
}

// Label for the admin table: shows how many teams are in a slot, or whether it is entire-ground.
export function adminSlotLabel(booking, bookings) {
  if (booking.status !== 'confirmed') return 'Cancelled';
  const active = bookingsForSlot(bookings, booking.date, booking.slotId);
  if (active.some((b) => b.type === TYPE.ENTIRE)) return 'Entire ground';
  const teams = active.filter((b) => b.type === TYPE.TEAM).length;
  if (teams >= MAX_TEAMS_PER_SLOT) return 'Fully booked';
  if (teams === 1) return '1 team needed';
  return '—';
}

// ---------- Slot templates (admin) ----------

function validateSlot(input, templates, excludeId) {
  const label = (input.label || '').trim();
  const { start, end } = input;
  const cfg = getConfig();

  if (label.length < 2 || label.length > 30) throw new BookingError('Label must be 2–30 characters.');
  if (!isValidTime(start) || !isValidTime(end)) throw new BookingError('Enter times in 24-hour HH:MM format.');
  if (toMinutes(start) >= toMinutes(end)) throw new BookingError('End time must be after the start time.');
  if (toMinutes(start) < toMinutes(cfg.openTime) || toMinutes(end) > toMinutes(cfg.closeTime)) {
    throw new BookingError(`Slots must fall within operating hours (${cfg.openTime}–${cfg.closeTime}).`);
  }
  const clash = templates.find((t) => t.id !== excludeId && rangesOverlap(t, { start, end }));
  if (clash) throw new BookingError(`This overlaps with "${clash.label}" (${clash.start}–${clash.end}).`);

  return { label, start, end };
}

const byStart = (a, b) => toMinutes(a.start) - toMinutes(b.start);

export function addSlot(input) {
  const data = getSlots();
  const clean = validateSlot(input, data.templates);
  const slot = { id: `slot-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ...clean };
  setSlots({ ...data, templates: [...data.templates, slot].sort(byStart) });
  return slot;
}

export function updateSlot(id, input) {
  const data = getSlots();
  if (!data.templates.some((t) => t.id === id)) throw new BookingError('Slot not found.');
  const clean = validateSlot(input, data.templates, id);
  const templates = data.templates.map((t) => (t.id === id ? { ...t, ...clean } : t)).sort(byStart);
  setSlots({ ...data, templates });
}

export function deleteSlot(id) {
  const data = getSlots();
  const today = todayISO();
  const hasUpcoming = getBookings().some((b) => b.status === 'confirmed' && b.slotId === id && b.date >= today);
  if (hasUpcoming) throw new BookingError('This slot has upcoming bookings. Cancel them before deleting the slot.');
  setSlots({
    templates: data.templates.filter((t) => t.id !== id),
    blocks: data.blocks.filter((b) => b.slotId !== id),
  });
}

// Returns true when the slot is now blocked for that date, false when it is unblocked.
export function toggleBlock(date, slotId) {
  const data = getSlots();
  const exists = data.blocks.some((b) => b.date === date && b.slotId === slotId);
  const blocks = exists
    ? data.blocks.filter((b) => !(b.date === date && b.slotId === slotId))
    : [...data.blocks, { date, slotId }];
  setSlots({ ...data, blocks });
  return !exists;
}

export function updatePrices({ teamPrice, entireGroundPrice }) {
  const t = Number(teamPrice);
  const e = Number(entireGroundPrice);
  if (!Number.isInteger(t) || t < 0 || t > 1000000) throw new BookingError('Enter a valid team price.');
  if (!Number.isInteger(e) || e < t || e > 1000000) {
    throw new BookingError('The entire-ground price must be a whole number at least equal to the team price.');
  }
  setConfig({ ...getConfig(), teamPrice: t, entireGroundPrice: e });
}

// ---------- Dashboard stats ----------

export function computeStats({ now = new Date(), days = 7 } = {}) {
  const config = getConfig();
  const slotsCfg = getSlots();
  const bookings = getBookings();
  const today = todayISO();
  const confirmed = bookings.filter((b) => b.status === 'confirmed');

  const counts = { available: 0, oneTeam: 0, fullyBooked: 0, entireReserved: 0 };
  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, i);
    slotsCfg.templates.forEach((slot) => {
      const { status } = getSlotState(date, slot, { bookings, slotsCfg, now });
      if (status === STATUS.OPEN) counts.available += 1;
      else if (status === STATUS.ONE_TEAM) counts.oneTeam += 1;
      else if (status === STATUS.FULL) counts.fullyBooked += 1;
      else if (status === STATUS.ENTIRE) counts.entireReserved += 1;
    });
  }

  return {
    todayBookings: confirmed.filter((b) => b.date === today).length,
    totalBookings: confirmed.length,
    cancelledBookings: bookings.length - confirmed.length,
    teamBookings: confirmed.filter((b) => b.type === TYPE.TEAM).length,
    entireBookings: confirmed.filter((b) => b.type === TYPE.ENTIRE).length,
    revenue: confirmed.reduce((sum, b) => sum + (b.amount || 0), 0),
    customers: new Set(bookings.map((b) => b.phone)).size,
    windowDays: days,
    ...counts,
    bookingWindowDays: config.bookingWindowDays,
  };
}
