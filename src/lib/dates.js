// Date and time helpers. All dates are local-time "YYYY-MM-DD" strings and "HH:MM" 24-hour strings.

export const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISODate(new Date());

export function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function isValidISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISODate(parseISODate(s)) === s;
}

export const monthKey = (iso) => iso.slice(0, 7);

export function isValidTime(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function slotStartDateTime(iso, hhmm) {
  const d = parseISODate(iso);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

// Two time ranges overlap when each starts before the other ends.
export function rangesOverlap(a, b) {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${pad(m)} ${suffix}`;
}

export const formatRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

export function formatDate(iso) {
  return parseISODate(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
