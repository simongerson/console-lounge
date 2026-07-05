# Console Lounge Manager — System Setup Guide

> Step-by-step instructions for setting up the app, network, and consoles from scratch.

---

## Step 1 — Get Your Local System Running First

Before touching any console, confirm your app is fully working locally.

**Checklist:**
- XAMPP is running — Apache and MySQL both green in the Control Panel
- Terminal is running `npm run dev` inside `C:\xampp\htdocs\console-lounge`
- App is accessible at `http://localhost:3000`
- Owner login works and redirects to `/dashboard`
- Staff PIN login works → opens shift → sessions grid shows 10 bays
- You can start and end a session on a test bay

> Do not move to hardware setup until all of the above are confirmed working.

---

## Step 2 — Set Up Your Network

All devices — consoles, monitoring PC, staff phones — must be on the **same Wi-Fi network**.

**In your router admin panel:**
1. Log in to your router (usually `http://192.168.1.1` in a browser)
2. Give the PC running your app a **fixed/static IP address** (e.g. `192.168.1.100`) so the address never changes between restarts
3. Set a strong Wi-Fi password for the lounge network
4. If possible, create a **separate guest network** for customers so their devices stay off your lounge network

> A static IP for your PC is critical — without it, the address changes every restart and staff lose access.

---

## Step 3 — Connect Each Console to the Lounge Wi-Fi

Connect consoles **one at a time** and confirm each is online before moving to the next.

### PS5
1. Turn on the PS5
2. Open **Settings**
3. Go to **Network**
4. Open **Settings**
5. Select **Set Up Internet Connection**
6. Choose **Wi-Fi**
7. Select your lounge Wi-Fi name from the list
8. Enter the Wi-Fi password and confirm
9. Verify it shows **Connected**

### PS4
1. Turn on the PS4
2. Open **Settings**
3. Go to **Network**
4. Select **Set Up Internet Connection**
5. Choose **Use Wi-Fi**
6. Select **Easy**
7. Pick your lounge Wi-Fi from the list
8. Enter the Wi-Fi password
9. Verify it shows **Connected**

> Repeat for every console. A console must be online before you can register it in the app.

---

## Step 4 — Register Consoles in Your App (Database)

Once consoles are on Wi-Fi, register them in your system via phpMyAdmin.

1. Open `http://localhost/phpmyadmin`
2. Click the `console_lounge` database on the left
3. Click the **SQL** tab
4. Paste and run the following (adjust names and types to match your actual hardware):

```sql
INSERT INTO consoles (id, name, console_type, status, is_active, sort_order) VALUES
  (UUID(), 'Bay 1',  'PS5', 'open', 1, 1),
  (UUID(), 'Bay 2',  'PS5', 'open', 1, 2),
  (UUID(), 'Bay 3',  'PS5', 'open', 1, 3),
  (UUID(), 'Bay 4',  'PS4', 'open', 1, 4),
  (UUID(), 'Bay 5',  'PS4', 'open', 1, 5),
  (UUID(), 'Bay 6',  'PS4', 'open', 1, 6),
  (UUID(), 'Bay 7',  'PS4', 'open', 1, 7),
  (UUID(), 'Bay 8',  'PS4', 'open', 1, 8),
  (UUID(), 'Bay 9',  'PS4', 'open', 1, 9),
  (UUID(), 'Bay 10', 'PS4', 'open', 1, 10);
```

> Change `console_type` to `PS5`, `PS4`, or `Xbox` depending on what you actually have in each bay.

---

## Step 5 — Seed Your Rate Cards

Add your pricing in phpMyAdmin → `console_lounge` → SQL tab. Adjust prices to match your lounge:

```sql
INSERT INTO session_rates (id, name, pricing_type, price, duration_minutes, is_active, sort_order) VALUES
  (UUID(), '30 Minutes', 'time',     50,  30,   1, 1),
  (UUID(), '1 Hour',     'time',     100, 60,   1, 2),
  (UUID(), '2 Hours',    'time',     180, 120,  1, 3),
  (UUID(), 'Full Day',   'time',     500, 480,  1, 4),
  (UUID(), 'Per Game',   'per_game', 0,   NULL, 1, 5);
```

> You can also add and manage rates from the owner dashboard once the Rates management page is built.

---

## Step 6 — Add Your First Staff Member

1. Go to `http://localhost:3000/staff`
2. Click **+ Add staff**
3. Enter the staff member's name and a 4-digit PIN
4. Click Save

**Then test the full staff workflow end-to-end:**

```
/pos  →  Enter PIN  →  Open Shift  →  Sessions Grid (10 bays)
→  Tap a bay  →  Start Session  →  End Session  →  Close Shift
```

All steps must work before going live.

---

## Step 7 — Make the App Accessible on the Network

Right now `localhost:3000` only works on the PC running the app. To let staff use it from a tablet or phone:

**Find your PC's local IP address:**
1. Open Command Prompt (press `Win + R`, type `cmd`, press Enter)
2. Type `ipconfig` and press Enter
3. Look for **IPv4 Address** under your Wi-Fi adapter — it will look like `192.168.1.100`

**Staff can now access the app from any device on the same Wi-Fi:**

| Role  | URL to open                          |
|-------|--------------------------------------|
| Staff | `http://192.168.1.100:3000/pos`      |
| Owner | `http://192.168.1.100:3000/login`    |
| Dashboard | `http://192.168.1.100:3000/dashboard` |

> Replace `192.168.1.100` with your actual PC IP address.

---

## Step 8 — Physical Bay Layout

Match your physical consoles to the names in the app so staff never get confused.

- Stick a small label on each TV or console stand: **Bay 1**, **Bay 2**, etc.
- The label must match exactly what is in the app
- Keep one PC or tablet permanently open on the **owner dashboard** for real-time monitoring
- The monitoring PC must stay on the same Wi-Fi as the consoles at all times

**Recommended physical layout:**

```
[Router/Access Point]
        |
        |--- Monitoring PC (fixed IP, always on)
        |--- Bay 1 PS5
        |--- Bay 2 PS5
        |--- Bay 3 PS5
        |--- Bay 4 PS4
        |--- Bay 5 PS4
        |--- Bay 6 PS4
        |--- Bay 7 PS4
        |--- Bay 8 PS4
        |--- Bay 9 PS4
        |--- Bay 10 PS4
```

---

## Step 9 — Understanding Ghost Session Detection

A **ghost session** is when a console is powered on (visible on the network) but has no session open in the app. This usually means a customer is playing without being charged.

**How it works in your system:**
- The monitoring page checks for consoles that appear active but have no matching open session
- When detected, a yellow alert appears on the monitoring screen
- Staff can review and dismiss each alert after investigating

**Current status:** Ghost detection is manual (staff-reported). The automated version — where the system pings each console IP every 30 seconds — is planned for Phase 4.

---

## Step 10 — Pre-Launch Checklist

Run through these before opening to real customers:

- [ ] All 10 consoles connected to lounge Wi-Fi and showing online
- [ ] All 10 bays registered in the database with correct names and types
- [ ] Rate cards seeded with correct prices
- [ ] At least one staff member added with a working PIN
- [ ] Owner account login tested
- [ ] Full shift flow tested: open shift → start session → end session → close shift
- [ ] Variance calculation on shift close is correct
- [ ] App accessible from a staff phone or tablet via local IP
- [ ] Monitoring PC is on and dashboard is open
- [ ] Physical bay labels match app bay names

---

## Pilot Rollout Recommendation

Do not launch all 10 bays at once. Start small:

**Week 1 — Pilot (3 bays)**
- Bay 1 PS5, Bay 2 PS4, Bay 3 PS4
- Run real sessions for a full day
- Close shifts and verify the variance report matches actual cash
- Fix any issues before expanding

**Week 2 — Full Launch (10 bays)**
- Add remaining bays once the pilot is stable
- Train all staff on PIN login, shift open, session start/end, and shift close

> Starting with 3 bays makes it easy to catch Wi-Fi, session timing, and shift reconciliation issues before they affect the whole lounge.

---

## Quick Reference — Key URLs

| Screen              | URL                                        |
|---------------------|--------------------------------------------|
| Staff PIN login     | `/pos`                                     |
| Open shift          | `/pos/shift-open`                          |
| Sessions grid       | `/pos/sessions`                            |
| End session         | `/pos/sessions/end`                        |
| Close shift         | `/pos/shift-close`                         |
| Owner login         | `/login`                                   |
| Owner dashboard     | `/dashboard`                               |
| Staff management    | `/staff`                                   |
| Monitoring          | `/monitoring`                              |
| Products            | `/products`                                |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Dashboard not redirecting to login | Check `middleware.js` is in the project root, not inside `app/` |
| Console not showing in sessions grid | Run the SQL in Step 4 — the `consoles` table may be empty |
| Staff PIN not working | Go to `/staff`, check the staff member is Active and not Locked |
| App not accessible from phone | Check the PC IP with `ipconfig` and make sure phone is on the same Wi-Fi |
| Session timer not updating | The grid auto-refreshes every 30 seconds — wait or reload the page |
| Shift close variance is wrong | Make sure all sessions were properly ended before closing the shift |

---

*Console Lounge Manager · Built with Next.js + MySQL (XAMPP) · Local deployment*
