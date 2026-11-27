# Emerald Oval Cricket Ground — Booking Platform (Frontend Demo)

A frontend-only React + Vite demo of a cricket ground booking website with a customer site and a separate admin dashboard.
All data lives in the browser's `localStorage`. There is no backend, database, payment gateway or WhatsApp integration.

## Requirements

- Node.js 18 or newer (tested with Node 22)
- npm

## Installation

```bash
cd cricket-ground-booking
npm install
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:5173).

Production build and preview:

```bash
npm run build
npm run preview
```

## Demo admin credentials

| Field    | Value      |
| -------- | ---------- |
| Username | `admin`    |
| Password | `admin123` |

Log in at `/admin`. These credentials are stored in `localStorage` under `ground_admin` and are for demo use only. Admin sessions use `sessionStorage` and end when the tab closes or you log out.

## Routes

| Route                    | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `/`                      | Home: hero image, how booking works, pricing, gallery          |
| `/ground`                | Ground details: photos (with lightbox), facilities, location, timings, instructions, cancellation policy |
| `/book`                  | Book a Slot: calendar, daily slots, team and entire-ground booking flow, summary |
| `/confirmation/:bookingId` | Booking confirmation with details, print option and next steps |
| `/my-bookings`           | Look up bookings by mobile number and cancel them under the policy |
| `/admin`                 | Admin login, then dashboard (Overview, Bookings & history, Slots & availability, Settings & demo data) |

## Booking rules

Each daily slot supports exactly two teams and can be booked as an entire ground.

| Slot state              | Meaning                                                                 | Customer actions                |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| Available               | No bookings yet                                                         | Book a Slot, Book Entire Ground |
| 1 Team Needed           | Team A booked; one spot remains                                         | Join as Team B                  |
| Fully Booked            | Team A and Team B booked                                                | None (moves to "Not available") |
| Entire Ground Reserved  | Whole slot reserved by one customer                                     | None                            |
| Unavailable             | Blocked by admin                                                        | None                            |
| Time passed             | Slot start time is in the past                                          | None                            |

- Entire-ground booking is only possible when no team has booked the slot. It blocks all team bookings for that slot.
- Duplicate bookings are blocked when the same mobile number or team name is already in the slot.
- Overlapping bookings for the same mobile number are blocked.
- Past dates and past slot times cannot be booked. Bookings open up to `bookingWindowDays` (default 30) days ahead.
- Availability is calculated from saved booking records and slot templates. Nothing is hardcoded in the UI.

### Cancellation (demo rules, customer-initiated)

| Time before slot start | Result                    |
| ---------------------- | ------------------------- |
| 48 hours or more       | Full refund (demo)        |
| 24 to 48 hours         | 50% refund (demo)         |
| Under 24 hours         | Online cancellation closed |

Admin cancellations always refund in full. Cancelling a team booking reopens its team spot. Cancelling an entire-ground booking reopens the whole slot. No real money moves.

## Admin features

- **Overview:** cards for today's bookings, total bookings, available slots, one-team-needed slots, fully booked slots, entire-ground bookings, team bookings and demo revenue. Also a live board for today's slots.
- **Bookings & history:** every booking (confirmed and cancelled) with customer, phone, team, date, time, type, slot state, status, amount and created time. Filter by date, status, type and free-text search. The table is sorted newest first, so it doubles as booking history. The slot-state column shows "1 team needed", "Fully booked" or "Entire ground" for each booking. Admin can cancel confirmed bookings.
- **Slots & availability:** add, edit and delete daily slot templates. Slots apply to every date and cannot overlap or fall outside operating hours. Deleting a slot with upcoming bookings is refused. Block or unblock any slot on any date.
- **Settings & demo data:** change the team and entire-ground prices, and reset all demo data after typing `RESET`.

## localStorage keys

| Key               | Contents                                                              |
| ----------------- | --------------------------------------------------------------------- |
| `ground_config`   | Ground name, address, hours, prices, facilities, instructions, photos, cancellation policy |
| `ground_slots`    | Daily slot templates and per-date blocks                              |
| `ground_bookings` | All bookings (confirmed and cancelled) with denormalised slot times   |
| `ground_admin`    | Demo admin username and password                                      |
| `ground_customers`| Customer records keyed by mobile number                               |

Sample data is written only when a key does not exist yet. Reloading the page never overwrites existing data. Use **Settings & demo data → Reset** to restore the samples.

Sync between views: every write dispatches a same-tab custom event (`ground:storage-updated`), and the native `storage` event covers other tabs. Customer and admin views re-render as soon as data changes.

## localStorage limitations

- **Device and browser specific.** Each browser and device has its own copy of the data. A booking made on one phone does not appear on another device or in another browser.
- **Not a real booking system.** Two customers on different devices can both book the same slot, and the app cannot detect it. It only prevents conflicts within one browser profile.
- **No authentication for customers.** My Bookings finds bookings by mobile number. Anyone who knows the number can see and cancel those bookings on the same device.
- **Admin login is client-side.** Credentials are visible in storage and in the source. Do not use this pattern in production.
- **Storage limits.** Browsers typically allow about 5 MB per origin. Large numbers of bookings or very large embedded data could hit that limit. The app shows an error if a save fails.
- **Clearing site data** (or private browsing) removes everything. Demo data reseeds on the next visit.

## Images

Photos are loaded from Unsplash URLs set in `src/lib/storage.js` (`DEFAULT_CONFIG.photos`). If an image fails to load, `ImageWithFallback` shows a styled pitch illustration with the photo's caption, so the layout never shows a blank box. To use your own photos, replace the `src` values in that file.

## Project structure

```
src/
  main.jsx                     App bootstrap (seeds demo data, router, toasts)
  App.jsx                      Routes for customer site and /admin
  lib/
    storage.js                 localStorage keys, defaults, read/write, reset, change events
    bookingLogic.js            All booking rules: availability, create, cancel, slot admin, stats
    dates.js                   Date and time helpers
  hooks/useStored.js           Subscribes components to a localStorage key
  context/ToastContext.jsx     Toast notifications
  components/                  CustomerLayout, Calendar, ConfirmDialog, ImageWithFallback
  pages/                       Home, GroundDetails, BookSlot, Confirmation, MyBookings, NotFound
  admin/                       AdminPage, AdminLogin, AdminDashboard
  admin/sections/              Overview, BookingsSection, SlotsSection, SettingsSection
  styles.css                   Theme (dark navy, white, green accents) and responsive layout
```

## Testing checklist

1. Book a team slot, then confirm it shows "1 Team Needed" and remains bookable.
2. Book the second team on the same slot. It should show "Fully Booked" and move to "Not available".
3. Try an entire-ground booking on a slot that already has a team. It should be refused with a clear message.
4. Book an entire ground on an empty slot. Team bookings for that slot should be refused.
5. Cancel bookings from My Bookings and from the admin. Check that the slot reopens.
6. Block a slot in admin. Check that customers cannot book it.
7. Add a slot in admin. Check that it appears on every date.
8. Refresh the page. Data should remain. Reset demo data and check that samples return.
9. Open the customer site and the admin in two tabs. Changes should appear in both without a reload.
