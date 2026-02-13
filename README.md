# Awad Hitawi — Booking Registry

A professional React web app for citizens to book a haircut with Awad Hitawi. Users sign in with Google, pick a day (Monday–Saturday) and time (12:00 PM–9:00 PM), and the barber receives the booking by email.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, Google OAuth
- **Backend:** Node (Express), Nodemailer (sends to `awadhetawy@gmail.com`)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Google OAuth (frontend)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a project (or use existing).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Add **Authorized JavaScript origins:** `http://localhost:5173` (and your production URL later).
6. Copy the **Client ID**.

Create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3. Email (backend)

The server sends booking emails to **awadhetawy@gmail.com**. To enable sending:

1. Use Gmail: create an [App Password](https://myaccount.google.com/apppasswords) (2FA must be on).
2. Create `server/.env`:

```env
SMTP_USER=awadhetawy@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
PORT=3001
```

(Or use any other SMTP provider by setting `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.)

### 4. Schedule (optional)

Booking days and times are configurable via `server/.env`:

| Variable       | Description | Default |
|----------------|-------------|---------|
| `OPEN_DAYS`    | Comma-separated weekdays: `0`=Sun, `1`=Mon … `6`=Sat | `1,2,3,4,5,6` (Mon–Sat) |
| `START_TIME`   | First slot, 24h `HH:mm` | `12:00` |
| `END_TIME`     | End of last slot, 24h `HH:mm` | `21:00` |
| `SLOT_MINUTES` | Minutes between slots (5–120) | `30` |

Example: open Sun–Thu 10:00–20:00 with 15‑min slots:

```env
OPEN_DAYS=0,1,2,3,4
START_TIME=10:00
END_TIME=20:00
SLOT_MINUTES=15
```

The app fetches this from `GET /api/config`. You can either set env vars (above) or use the **Configure hours** page (see below).

**Configure hours (barber only):** Open **`/admin`** in the browser (e.g. `https://yoursite.com/admin`). There you can set open days (Sun–Sat), start/end time, vacation dates, and slot duration. Settings are saved to `server/data/schedule.json` and override env. To protect the page, set `ADMIN_SECRET` in `server/.env`; the barber will need to enter that key once to save. The link is not shown to customers.

### 5. Run

**Development (client + API):**

```bash
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001) (Vite proxies `/api` to it)

**Production:** build the client and run the server:

```bash
npm run build
cd server && npm start
```

Serve the `client/dist` folder with the same server or a static host; set `PORT` and keep `/api` pointing to the Node server.

## Contact

- **Email:** awadhetawy@gmail.com  
- **Phone:** +962 78 780 6337
