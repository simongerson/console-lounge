# Console Lounge Manager — Live Deployment Guide

> How to take your system from local XAMPP to a real live server accessible anywhere.

---

## Overview — What Changes Going Live

When running locally, everything lives on your PC. Going live means:

| What | Local (XAMPP) | Live |
|------|--------------|------|
| Database | MySQL on your PC | Cloud MySQL (PlanetScale / Railway / Clever Cloud) |
| App server | `npm run dev` on your PC | Vercel / Railway (always running) |
| URL | `http://localhost:3000` | `https://yourdomain.com` |
| Access | Only on your local Wi-Fi | Anywhere — phone, tablet, any network |
| Uptime | Only when your PC is on | 24/7 |

---

## Step 1 — Choose Your Hosting Stack

You need two services: one for the **database** and one for the **app**. These are the recommended free/low-cost options:

### Database (MySQL)
| Service | Free Tier | Notes |
|---------|-----------|-------|
| **PlanetScale** | Yes (hobby) | Best MySQL hosting, scales well |
| **Railway** | $5/month | Simple, MySQL + app hosting in one place |
| **Clever Cloud** | Yes (limited) | Good free MySQL option |
| **Aiven** | Free trial | Reliable, good for production |

> **Recommended:** Railway — lets you host both the MySQL database and the Next.js app in one place, simplest setup.

### App Hosting (Next.js)
| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Vercel** | Yes | Made by the Next.js team, best performance |
| **Railway** | $5/month | Hosts app + database together |
| **Render** | Yes (slow cold starts) | Good free option |

> **Recommended combination:** Vercel (app) + PlanetScale (database) — both have generous free tiers and are production-ready.

---

## Step 2 — Export Your Local Database

Before setting up anything online, export your current data from XAMPP so you can import it to the cloud.

1. Open `http://localhost/phpmyadmin`
2. Click the `console_lounge` database on the left
3. Click the **Export** tab at the top
4. Leave format as **SQL**
5. Click **Export**
6. Save the `.sql` file — this is your full database backup

> Keep this file safe. You will use it to import your tables and data into the cloud database.

---

## Step 3 — Set Up Cloud Database (PlanetScale example)

1. Go to [planetscale.com](https://planetscale.com) and create a free account
2. Click **Create a new database**
3. Name it `console_lounge`
4. Choose the region closest to Kenya (e.g. AWS Mumbai or EU)
5. Once created, click **Connect**
6. Choose **Connect with: Node.js**
7. Copy the connection string — it will look like:

```
mysql://username:password@host/console_lounge?ssl={"rejectUnauthorized":true}
```

8. Go to the **Branches** tab → main branch → click **Console**
9. Paste and run your exported SQL from Step 2 to recreate all your tables and data

> PlanetScale does not support foreign key constraints by default — if your SQL export includes `FOREIGN KEY` lines, remove them before importing. Your tables will still work correctly.

---

## Step 4 — Update Your Environment Variables

Your local `.env.local` has:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=console_lounge
DB_PORT=3306
JWT_SECRET=console_lounge_secret_key_change_this_in_production
```

For live, you need to replace these with your cloud database credentials. Create a new `.env.production` file (or update the values on your hosting platform's dashboard):

```env
DB_HOST=your-cloud-db-host.planetscale.com
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=console_lounge
DB_PORT=3306
DB_SSL=true

JWT_SECRET=change-this-to-a-long-random-secret-minimum-32-characters
```

> **Important:** Never commit `.env` files to GitHub. They contain your database password.

### Generate a strong JWT secret:
Run this in your terminal and copy the output:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5 — Update Your Database Connection for SSL

Cloud databases require SSL. Update `lib/db.js` to support SSL connections:

```js
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: true }
    : false,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
})

export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params)
  return rows
}
```

This version works for both local (SSL off) and live (SSL on) depending on your `.env` value.

---

## Step 6 — Push Your Code to GitHub

Vercel deploys directly from GitHub, so your code needs to be there.

**If you have not set up Git yet:**

```bash
cd C:\xampp\htdocs\console-lounge

git init
git add .
git commit -m "Initial commit"
```

**Create a `.gitignore` file** in the project root if you do not have one:

```
node_modules/
.env.local
.env.production
.next/
```

**Create a GitHub repository:**
1. Go to [github.com](https://github.com) and sign in
2. Click **New repository**
3. Name it `console-lounge`
4. Set it to **Private**
5. Click **Create repository**
6. Follow the instructions to push your existing code:

```bash
git remote add origin https://github.com/yourusername/console-lounge.git
git branch -M main
git push -u origin main
```

---

## Step 7 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New Project**
3. Select your `console-lounge` repository
4. Vercel will auto-detect it as a Next.js project
5. Before clicking Deploy, click **Environment Variables**
6. Add each variable from your `.env.production` one by one:

| Key | Value |
|-----|-------|
| `DB_HOST` | your cloud database host |
| `DB_USER` | your database username |
| `DB_PASSWORD` | your database password |
| `DB_NAME` | `console_lounge` |
| `DB_PORT` | `3306` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | your generated secret |

7. Click **Deploy**
8. Vercel will build and deploy your app — takes about 2 minutes
9. You will get a live URL like `https://console-lounge.vercel.app`

> Every time you push new code to GitHub, Vercel automatically redeploys. No manual steps needed.

---

## Step 8 — Connect a Custom Domain (Optional)

If you want a professional URL like `https://manager.yourloungesname.com`:

1. Buy a domain from Namecheap, GoDaddy, or Cloudflare Domains
2. In Vercel, go to your project → **Settings** → **Domains**
3. Add your domain and follow the DNS instructions Vercel provides
4. Vercel handles SSL certificates automatically — your site will be `https://` within minutes

---

## Step 9 — Test Everything on Live

Do not assume local testing is enough. Test every flow on the live URL:

- [ ] Owner login works at `https://yourapp.vercel.app/login`
- [ ] Dashboard loads with correct data
- [ ] Staff PIN login works at `/pos`
- [ ] Opening a shift works
- [ ] Starting and ending a session works
- [ ] Console grid shows correct bay statuses
- [ ] Closing a shift shows correct variance
- [ ] Staff management — add, reset PIN, disable works
- [ ] No 500 errors in the browser console (press F12 → Console tab)

> If you see a 500 error after deploying, go to Vercel → your project → **Functions** → check the logs. It almost always means an environment variable is missing or wrong.

---

## Step 10 — Connect the Lounge to the Live System

This is the physical setup inside the lounge once your app is live online. The goal is to connect every console to the lounge Wi-Fi, register each one in the live database, and get staff accessing the live URL from their devices.

---

### 10A — What You Need in the Lounge

Before starting, make sure you have:

- A router or Wi-Fi access point with stable coverage across all bays
- All PS5/PS4 consoles powered on
- One lounge PC or tablet that will stay open on the owner dashboard
- Your live app URL (e.g. `https://console-lounge.vercel.app`)
- Your owner login credentials

---

### 10B — Connect Each Console to the Lounge Wi-Fi

Every console must join the same lounge Wi-Fi network. Do this one console at a time.

**PS5:**
1. Turn on the PS5
2. Open **Settings** (top-right gear icon)
3. Go to **Network**
4. Select **Settings**
5. Choose **Set Up Internet Connection**
6. Select **Wi-Fi**
7. Pick your lounge Wi-Fi name from the list
8. Enter the Wi-Fi password
9. Wait for the connection test to complete
10. Confirm it shows **Internet: Connected**

**PS4:**
1. Turn on the PS4
2. Open **Settings**
3. Go to **Network**
4. Select **Set Up Internet Connection**
5. Choose **Use Wi-Fi**
6. Select **Easy**
7. Pick your lounge Wi-Fi from the list
8. Enter the Wi-Fi password
9. Confirm it shows **Internet: Connected**

> Repeat for all 10 bays. A console that fails the connection test will not appear correctly in your monitoring screen. Fix Wi-Fi issues before registering the bay in the app.

---

### 10C — Register Each Bay in the Live Database

Once consoles are on Wi-Fi, add them to your live cloud database.

**Option A — Via your live app (once Console Management page is built):**
1. Go to `https://yourapp.vercel.app/login`
2. Log in as owner
3. Go to Console Management
4. Add each bay with its name and type

**Option B — Directly in your cloud database console (available now):**

Go to your PlanetScale or Railway database console and run:

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

> Change `console_type` values to match what you actually have — `PS5`, `PS4`, or `Xbox`.

After running this, go to `https://yourapp.vercel.app/pos`, log in with a staff PIN, open a shift, and confirm all 10 bays appear in the sessions grid.

---

### 10D — Seed Rate Cards on Live Database

Add your pricing to the live database the same way:

```sql
INSERT INTO session_rates (id, name, pricing_type, price, duration_minutes, is_active, sort_order) VALUES
  (UUID(), '30 Minutes', 'time',     50,  30,   1, 1),
  (UUID(), '1 Hour',     'time',     100, 60,   1, 2),
  (UUID(), '2 Hours',    'time',     180, 120,  1, 3),
  (UUID(), 'Full Day',   'time',     500, 480,  1, 4),
  (UUID(), 'Per Game',   'per_game', 0,   NULL, 1, 5);
```

---

### 10E — Add Staff Members on Live

1. Go to `https://yourapp.vercel.app/staff`
2. Log in as owner
3. Click **+ Add staff**
4. Enter each staff member's name and assign a unique 4-digit PIN
5. Repeat for every staff member who will operate the lounge

> Each staff member must have a unique PIN. Do not reuse PINs across different staff.

---

### 10F — Set Up the Lounge Devices

**Monitoring PC (always on):**
- Open a browser and go to `https://yourapp.vercel.app/login`
- Log in as owner
- Leave the dashboard open on the **Bays** or **Overview** tab
- This PC should stay on at all times during lounge hours
- Bookmark the dashboard URL for easy access

**Staff tablet or phone:**
- Open a browser and go to `https://yourapp.vercel.app/pos`
- Bookmark this URL or add it to the home screen (on phone: browser menu → Add to Home Screen)
- Staff use this for PIN login, opening shifts, starting/ending sessions, and closing shifts

**Owner phone:**
- Go to `https://yourapp.vercel.app/login`
- Log in as owner
- Bookmark the dashboard — you can now monitor the lounge from anywhere

---

### 10G — Add to Home Screen (PWA-style shortcut)

To make the app feel like a native app on phones and tablets:

**On Android (Chrome):**
1. Open `https://yourapp.vercel.app/pos` in Chrome
2. Tap the three-dot menu (top right)
3. Tap **Add to Home screen**
4. Name it "Console Lounge" and tap **Add**

**On iPhone (Safari):**
1. Open `https://yourapp.vercel.app/pos` in Safari
2. Tap the **Share** button (box with arrow at the bottom)
3. Scroll down and tap **Add to Home Screen**
4. Name it "Console Lounge" and tap **Add**

Staff can now open the app directly from their phone home screen like any other app.

---

### 10H — Label Your Physical Bays

This is easy to overlook but critical for staff accuracy:

- Print or write labels for each bay: **Bay 1**, **Bay 2**, ..., **Bay 10**
- Stick the label on the TV stand, shelf, or console itself — somewhere clearly visible
- The label name must match exactly what is in the app
- If a customer asks which bay they are on, staff must be able to identify it instantly

---

### 10I — Run a Full Live Test Before Opening

Do not open to customers until this entire flow passes on the live system:

**Staff flow:**
- [ ] Staff opens `https://yourapp.vercel.app/pos` on their device
- [ ] Enters PIN → logs in successfully
- [ ] Opens a shift and enters float cash
- [ ] Sessions grid loads — all 10 bays visible
- [ ] Taps an open bay → selects a rate → starts a session → bay turns green
- [ ] Taps the active bay → ends the session → confirms payment
- [ ] Closes the shift → variance summary shows correct totals
- [ ] Signs out

**Owner flow:**
- [ ] Owner opens `https://yourapp.vercel.app/login` from phone
- [ ] Logs in and sees dashboard with today's revenue
- [ ] Bays tab shows correct statuses (active/open)
- [ ] Sessions tab shows the test session just completed

**If any step fails** — check Vercel function logs before opening to customers.

---

### 10J — Staff URL Reference Card

Print this and keep it at the counter:

```
╔══════════════════════════════════════════════╗
║         CONSOLE LOUNGE MANAGER               ║
║                                              ║
║  Staff login:                                ║
║  https://yourapp.vercel.app/pos              ║
║                                              ║
║  Owner dashboard:                            ║
║  https://yourapp.vercel.app/login            ║
║                                              ║
║  Wi-Fi name:  [your lounge Wi-Fi name]       ║
║  Wi-Fi pass:  [your Wi-Fi password]          ║
╚══════════════════════════════════════════════╝
```

> Replace `yourapp.vercel.app` with your actual live URL or custom domain.

---

### 10K — How the Live System Differs from Local

| Thing | Local Setup | Live Setup |
|-------|-------------|------------|
| App URL for staff | `http://192.168.1.100:3000/pos` | `https://yourapp.vercel.app/pos` |
| App URL for owner | `http://192.168.1.100:3000/login` | `https://yourapp.vercel.app/login` |
| PC must be on | Yes — app stops if PC turns off | No — app runs 24/7 on Vercel |
| Owner can monitor remotely | No — local Wi-Fi only | Yes — any network, anywhere |
| Staff device network | Must be on lounge Wi-Fi | Any internet connection |
| Database | XAMPP on local PC | PlanetScale/Railway cloud |
| Console Wi-Fi setup | Same | Same — no change |

> The consoles themselves do not change at all between local and live. They still just connect to the lounge Wi-Fi. The only difference is where the staff and owner access the app from.

---

## Step 11 — Ongoing Maintenance

### Database backups
- PlanetScale and Railway both do automatic backups
- Additionally, export a manual backup from phpMyAdmin or your cloud console monthly

### Updating the app
```bash
# Make changes locally, test on localhost first
git add .
git commit -m "describe what you changed"
git push
# Vercel automatically deploys the update within 2 minutes
```

### Monitoring errors
- Vercel dashboard → **Functions** tab shows all API errors in real time
- Set up free error monitoring with [Sentry](https://sentry.io) if the lounge grows

---

## Cost Summary

Running this system live can be essentially free to start:

| Service | Cost |
|---------|------|
| Vercel (app hosting) | Free |
| PlanetScale (database) | Free hobby tier |
| Custom domain | ~$10–15/year (optional) |
| **Total** | **Free or ~$1/month** |

> If the lounge scales and you need more database connections or storage, Railway at $5/month becomes the cleanest all-in-one option.

---

## Troubleshooting Live Deployments

| Problem | Fix |
|---------|-----|
| App deploys but shows database error | Check all environment variables in Vercel — one is likely missing or has a typo |
| Login not working on live | Make sure `JWT_SECRET` is set in Vercel environment variables |
| SSL connection error to database | Set `DB_SSL=true` in Vercel and update `lib/db.js` as shown in Step 5 |
| Changes not showing after push | Check Vercel dashboard — build may have failed, check the build logs |
| Works locally but 500 error on live | A package or env variable is missing — check Vercel function logs |
| PlanetScale import fails | Remove all `FOREIGN KEY` lines from your SQL export before importing |
| Session not persisting after login | `JWT_SECRET` must be identical across all deployments — do not change it after launch |

---

## Summary — Local vs Live at a Glance

```
LOCAL (development)              LIVE (production)
─────────────────────            ─────────────────────
XAMPP MySQL          →           PlanetScale / Railway
npm run dev          →           Vercel (auto-deploy)
localhost:3000       →           https://yourapp.vercel.app
.env.local           →           Vercel Environment Variables
Manual restart       →           Auto-deploy on git push
Wi-Fi only           →           Accessible anywhere
```

---

*Console Lounge Manager · Live Deployment Guide · Next.js + MySQL + Vercel*
