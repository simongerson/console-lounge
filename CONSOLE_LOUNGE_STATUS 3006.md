# Console Lounge Manager
## Project Status & Build Log

**Stack:** Next.js 14 (App Router) · MySQL (XAMPP) · JWT Auth · Tailwind CSS  
**Local URL:** `http://localhost:3000`  
**Project folder:** `C:\xampp\htdocs\console-lounge`  
**Deploy later:** Vercel + PlanetScale or Railway MySQL  
**Reference:** PsTally (pstally.com) — building our own version  
**Color scheme:** Cream/beige background (`#f4f1eb`) · dark text · teal accents (`#0d9488`)

---

## How Code Is Generated in This Project

All code is given as **copy-paste blocks in chat** — no file downloads.

### Rules we follow:
- **2 features at a time** — each message gives exactly 2 pages or API routes
- **Every file shows its exact destination** clearly labeled at the top like:
  ```
  File: app/dashboard/page.js
  File: app/api/shifts/route.js
  ```
- **New folders** are created manually by you before pasting the file
- **SQL** is run in phpMyAdmin → `console_lounge` database → SQL tab
- After each pair of files, test before moving to the next 2

### Folder naming rules:
- Pages go in `app/[pagename]/page.js`
- API routes go in `app/api/[resource]/route.js`
- Dynamic routes use brackets: `app/api/staff/[id]/route.js`
- Components go in `components/[Name].jsx`
- Shared utilities go in `lib/[name].js`

---

## Environment Setup

### `.env.local` (root of project)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=console_lounge
DB_PORT=3306
JWT_SECRET=console_lounge_secret_key_change_this_in_production
```

### Packages installed
```bash
npm install mysql2 bcryptjs jsonwebtoken cookie jose
```

---

## Database Tables (MySQL)

| Table | Purpose |
|---|---|
| `owners` | Owner login — email + bcrypt password |
| `staff` | Staff members — bcrypt PIN + lockout tracking |
| `shifts` | Every shift — float, cash, M-Pesa, variance |
| `consoles` | 10 bays — name, type (PS5/PS4/Xbox), status |
| `session_rates` | Game types — Per Game / Time Based / Both, free-after rules |
| `game_sessions` | Every gaming session — console, staff, duration, amount, payment |
| `expenses` | Daily expenses by category |
| `cash_outs` | Staff withdrawal requests — pending/approved |
| `debts` | Unpaid sessions — balance tracking |
| `products` | Snacks/drinks/accessories catalogue |
| `product_sales` | Every product sale — tied to shift and staff |
| `monitor_events` | Ghost session alerts and console activity log |

### Seeded data
- 10 consoles (Bay 1–5 = PS5, Bay 6–10 = PS4)
- 6 default game rates (30min, 1hr, 2hr, 3hr, Full Day, Open)
- 5 default products (Crisps, Soda, Energy Drink, Water, Headset Rental)

---

## Authentication

| Who | Method | Where |
|---|---|---|
| Owner | Email + password → JWT httpOnly cookie (12hr) | `/login` |
| Route protection | `middleware.js` checks JWT on all owner routes | root level |
| Staff | 4-digit PIN → bcrypt verify → localStorage session | `/pos` |
| Staff lockout | 5 failed attempts → 15min lockout in DB | `/api/auth/pin` |

---

## File Structure (current state)

```
console-lounge/
├── .env.local
├── middleware.js                          ✅ done
├── package.json
│
├── lib/
│   └── db.js                             ✅ done — MySQL pool + query helpers
│
├── components/
│   ├── NavWrapper.jsx                     ✅ done — hides nav on /pos and /login
│   └── Sidebar.jsx                        ✅ done — PsTally-style left sidebar
│
└── app/
    ├── globals.css                        ✅ done — cream bg + teal theme
    ├── layout.js                          ✅ done — wraps with NavWrapper
    │
    ├── login/
    │   └── page.js                        ✅ done — dark bg, teal card, JWT login
    │
    ├── dashboard/
    │   └── page.js                        ✅ done — 2-col layout matching PsTally
    │
    ├── shifts/
    │   └── page.js                        ✅ done — discrepancy dots, shift cards
    │
    ├── consoles/
    │   └── page.js                        ✅ done — bay list, inline edit, add bay
    │
    ├── rates/
    │   └── page.js                        ✅ done — Game Types, Per Game/Time/Both
    │
    ├── staff/
    │   └── page.js                        ✅ done — add staff, reset PIN, disable
    │
    ├── products/
    │   └── page.js                        ✅ done — catalog + sales history tabs
    │
    ├── monitoring/
    │   └── page.js                        ✅ done — ghost alerts, bay grid, event log
    │
    ├── pos/
    │   ├── page.js                        ✅ done — staff PIN login numpad
    │   ├── shift-open/
    │   │   └── page.js                    ✅ done — float declaration
    │   ├── shift-close/
    │   │   └── page.js                    ✅ done — cash count + variance summary
    │   └── sessions/
    │       ├── page.js                    ✅ done — 10-bay grid, start session modal
    │       └── end/
    │           └── page.js               ✅ done — end session, payment confirm
    │
    └── api/
        ├── auth/
        │   ├── login/route.js             ✅ done — owner JWT login
        │   ├── logout/route.js            ✅ done — clears cookie
        │   └── pin/route.js              ✅ done — staff PIN verify + lockout
        │
        ├── dashboard/route.js            ✅ done — revenue, bays, shifts, chart
        │
        ├── consoles/
        │   ├── route.js                  ✅ done — GET all consoles with session
        │   ├── add/route.js              ✅ done — POST new console
        │   └── [id]/route.js             ✅ done — PATCH name/type/active
        │
        ├── rates/
        │   ├── route.js                  ✅ done — GET all, POST new rate
        │   └── [id]/route.js             ✅ done — PATCH edit, toggle active
        │
        ├── sessions/
        │   ├── start/route.js            ✅ done — POST start session
        │   ├── end/route.js              ✅ done — POST end session
        │   └── [id]/route.js             ✅ done — GET single session
        │
        ├── shifts/
        │   ├── route.js                  ✅ done — GET shifts list + summary
        │   ├── active/route.js           ✅ done — GET active shift for staff
        │   ├── open/route.js             ✅ done — POST open shift
        │   └── close/route.js            ✅ done — POST close + reconcile
        │
        ├── staff/
        │   ├── route.js                  ✅ done — GET list, POST add staff
        │   └── [id]/route.js             ✅ done — PATCH PIN/role/active
        │
        └── products/
            ├── route.js                  ✅ done — GET catalog, POST add
            ├── [id]/route.js             ✅ done — PATCH edit/disable
            └── sales/route.js            ✅ done — GET history, POST sale
```

---

## Pages Built — Visual Reference

| Page | URL | Matches PsTally screenshot |
|---|---|---|
| Owner login | `/login` | Dark bg, teal controller icon, card form |
| Dashboard | `/dashboard` | 2-col, revenue card, bays panel, on-shift, chart |
| Shifts | `/shifts` | Discrepancy dots, summary cards, shift breakdown |
| Consoles | `/consoles` | Bay list, inline edit, add at bottom |
| Game Types | `/rates` | Per Game / Time Based / Both, free-after rules |
| Staff | `/staff` | Add, reset PIN, enable/disable, role badge |
| Products | `/products` | Catalog + Sales History tabs, Add Product modal |
| Monitoring | `/monitoring` | Ghost alerts, bay grid, ghost log, event log |
| PIN Login | `/pos` | Dark bg, numpad, lockout countdown |
| Shift Open | `/pos/shift-open` | Float input, date display |
| Sessions Grid | `/pos/sessions` | 10-bay grid, green dots, start session modal |
| End Session | `/pos/sessions/end` | Payment method, M-Pesa ref, confirm button |
| Shift Close | `/pos/shift-close` | Cash + M-Pesa input, variance summary screen |

---

## What Is Left to Build

### Phase 2 — Finance pages (next up)

| # | Feature | Files needed |
|---|---|---|
| 1 | Expenses page | `app/expenses/page.js` + `app/api/expenses/route.js` |
| 2 | Cash Outs page | `app/cashouts/page.js` + `app/api/cashouts/route.js` + `app/api/cashouts/[id]/route.js` |
| 3 | Debts page | `app/debts/page.js` + `app/api/debts/route.js` + `app/api/debts/[id]/route.js` |
| 4 | WhatsApp shift report | Update `app/pos/shift-close/page.js` to add WhatsApp share |
| 5 | Income overview | `app/income/page.js` + `app/api/income/route.js` |

### Phase 3 — Reports + PWA

| # | Feature | Files needed |
|---|---|---|
| 1 | Reports page | `app/reports/page.js` + `app/api/reports/route.js` |
| 2 | Session history per console | `app/consoles/[id]/page.js` |
| 3 | PWA — install on phone | `public/sw.js` + `public/manifest.json` + `app/offline/page.js` |

### Phase 4 — Advanced

| # | Feature | Notes |
|---|---|---|
| 1 | Real M-Pesa Daraja | Needs Safaricom developer account + till number |
| 2 | Tournament brackets | Knockout/group stage, public link, live scores |
| 3 | Salary management | Staff salary log, advances, outstanding |
| 4 | Multi-branch | Each lounge location has own consoles + staff |

---

## Test Flow (full system check)

### Owner flow:
1. Go to `http://localhost:3000/login`
2. Login with owner email + password → redirects to `/dashboard`
3. Check `/dashboard` — revenue card, bays, on-shift staff
4. Check `/shifts` — shift history with discrepancy dots
5. Check `/consoles` — 10 bays listed, try adding a new one
6. Check `/rates` — game types, try adding Per Game type
7. Check `/staff` — add a test staff member with PIN `1234`
8. Check `/products` — products listed, add one
9. Check `/monitoring` — ghost alert simulation visible

### Staff flow:
1. Go to `http://localhost:3000/pos`
2. Enter PIN `1234` → redirects to shift-open
3. Enter float (e.g. `500`) → click Start shift
4. Sessions grid shows 10 bays
5. Tap an open bay → pick rate → Start session → bay turns green
6. Tap End session → confirm payment → bay goes open
7. Click End shift → enter cash count → see variance summary

---

## Data Reset (clear all test data)

Run in phpMyAdmin → console_lounge → SQL tab:

```sql
DELETE FROM product_sales;
DELETE FROM monitor_events;
DELETE FROM debts;
DELETE FROM cash_outs;
DELETE FROM expenses;
DELETE FROM game_sessions;
DELETE FROM shifts;
UPDATE consoles SET status = 'open';
```

---

## Deployment Checklist (when ready)

1. Export MySQL from phpMyAdmin → Save as `.sql` file
2. Create MySQL DB on **PlanetScale** (free) or **Railway** ($5/mo)
3. Import schema + seed data to cloud DB
4. Update `.env.local` with production credentials
5. Push project to GitHub
6. Deploy on **Vercel** — connect GitHub repo
7. Add environment variables in Vercel dashboard
8. Test live URL with owner login

---

## Next Session Starting Point

Continue from **Phase 2 — Expenses + Cash Outs**

Tell Claude:
> "I am building Console Lounge Manager. We left off at Phase 2. 
> Next 2 files are Expenses page and Cash Outs page. 
> Stack: Next.js 14, MySQL via XAMPP, JWT auth.
> Give me code as copy-paste blocks, 2 files at a time, 
> with exact file destinations."

Then attach this MD file so Claude has full context.
