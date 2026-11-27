// The only persistence layer: browser localStorage.
// Every write dispatches a same-tab custom event so open views re-render immediately.
// Other tabs receive the native "storage" event.
import { addDays, todayISO } from './dates.js';

export const KEYS = {
  config: 'ground_config',
  slots: 'ground_slots',
  bookings: 'ground_bookings',
  admin: 'ground_admin',
  customers: 'ground_customers',
};

export const SESSION_KEY = 'ground_admin_session';
export const STORAGE_EVENT = 'ground:storage-updated';

export const DEFAULT_CONFIG = {
  name: 'Emerald Oval Cricket Ground',
  tagline: 'Full-size turf pitches, floodlit nets and a scoreboard built for serious cricket.',
  address: '14 Stadium Road, Demo City, Tamil Nadu 600001',
  phone: '+91 98765 43210',
  email: 'bookings@emeraldoval.example',
  openTime: '06:00',
  closeTime: '21:00',
  teamPrice: 1500,
  entireGroundPrice: 2500,
  bookingWindowDays: 30,
  cancellation: { fullRefundHours: 48, halfRefundHours: 24 },
  facilities: [
    'Floodlights',
    'Changing rooms',
    'Drinking water',
    'Parking',
    'Scoreboard',
    'Cafeteria',
    'First-aid kit',
    'Bowling machine',
  ],
  instructions: [
    'Arrive 15 minutes before your slot to set up and warm up.',
    'Carry your own protective gear. Helmets are available on request.',
    'Only the booked team may use the ground. Please keep the outfield clean.',
    'Booking is confirmed once you receive your booking ID on the confirmation page.',
    'Two teams can share one slot. The slot is fully booked once both teams have joined.',
    'Booking the entire ground closes the slot to all team bookings.',
  ],
  photos: [
    {
      src: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
      alt: 'Cricket ground at sunrise with a green outfield',
    },
    {
      src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=80',
      alt: 'Cricket pitch with stumps on a sunny day',
    },
    {
      src: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1600&q=80',
      alt: 'Cricket players practising in the nets',
    },
    {
      src: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1600&q=80',
      alt: 'Cricket ball resting on the turf',
    },
  ],
};

export const DEFAULT_SLOTS = {
  templates: [
    { id: 'slot-morning', label: 'Morning', start: '06:30', end: '08:30' },
    { id: 'slot-midday', label: 'Late Morning', start: '10:30', end: '12:30' },
    { id: 'slot-afternoon', label: 'Afternoon', start: '14:00', end: '16:00' },
  ],
  blocks: [],
};

export const DEFAULT_ADMIN = { username: 'admin', password: 'admin123' };

function sampleBookings() {
  const today = todayISO();
  const createdAt = new Date().toISOString();
  return [
    {
      id: 'CGB-DEMO01',
      status: 'confirmed',
      date: addDays(today, 1),
      slotId: 'slot-morning',
      start: '06:30',
      end: '08:30',
      slotLabel: 'Morning',
      type: 'team',
      customerName: 'Arjun Mehta',
      phone: '9000000001',
      teamName: 'Blue Strikers',
      amount: DEFAULT_CONFIG.teamPrice,
      createdAt,
    },
    {
      id: 'CGB-DEMO02',
      status: 'confirmed',
      date: addDays(today, 2),
      slotId: 'slot-afternoon',
      start: '14:00',
      end: '16:00',
      slotLabel: 'Afternoon',
      type: 'entire',
      customerName: 'Ravi Kumar',
      phone: '9000000002',
      teamName: 'Thunder XI',
      amount: DEFAULT_CONFIG.entireGroundPrice,
      createdAt,
    },
  ];
}

function sampleCustomers() {
  return [
    { phone: '9000000001', name: 'Arjun Mehta', teamName: 'Blue Strikers', createdAt: new Date().toISOString(), lastBookingAt: new Date().toISOString() },
    { phone: '9000000002', name: 'Ravi Kumar', teamName: 'Thunder XI', createdAt: new Date().toISOString(), lastBookingAt: new Date().toISOString() },
  ];
}

export function readKey(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('We could not save your change. Browser storage may be full or disabled.');
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

// Seeds sample data for keys that do not exist yet. Existing keys are left untouched.
export function initStorage() {
  const seeds = {
    [KEYS.config]: DEFAULT_CONFIG,
    [KEYS.slots]: DEFAULT_SLOTS,
    [KEYS.bookings]: sampleBookings(),
    [KEYS.admin]: DEFAULT_ADMIN,
    [KEYS.customers]: sampleCustomers(),
  };
  Object.entries(seeds).forEach(([key, value]) => {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

// Removes all ground_* keys and re-seeds the demo data. Called only after explicit admin confirmation.
export function resetDemoData() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.removeItem(SESSION_KEY);
  initStorage();
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export const getConfig = () => readKey(KEYS.config, DEFAULT_CONFIG);
export const setConfig = (value) => writeKey(KEYS.config, value);
export const getSlots = () => readKey(KEYS.slots, DEFAULT_SLOTS);
export const setSlots = (value) => writeKey(KEYS.slots, value);
export const getBookings = () => readKey(KEYS.bookings, []);
export const setBookings = (value) => writeKey(KEYS.bookings, value);
export const getCustomers = () => readKey(KEYS.customers, []);
export const setCustomers = (value) => writeKey(KEYS.customers, value);
export const getAdmin = () => readKey(KEYS.admin, DEFAULT_ADMIN);
