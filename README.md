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

## Deploying to Vercel

This application is designed to run on Vercel's free tier with zero ongoing costs. Follow these steps to deploy:

### Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- A [GitHub](https://github.com) account (to connect your repository)
- Google OAuth credentials (see Setup section above)

### Step 1: Set Up Vercel Postgres

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select your existing project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose **Continue** on the free Hobby plan
6. Name your database (e.g., `booking-db`)
7. Select your preferred region (choose closest to your users)
8. Click **Create**

Vercel will automatically add the `POSTGRES_URL` environment variable to your project.

**Free Tier Limits:**
- 256 MB storage (sufficient for thousands of bookings)
- 60 hours compute per month
- 1 GB data transfer

### Step 2: Initialize Database Schema

After creating your Postgres database, you need to create the tables:

1. In your Vercel Dashboard, go to **Storage** → your Postgres database
2. Click on the **Query** tab
3. Copy and paste the contents of `scripts/init-db.sql`
4. Click **Run Query**

This creates the `bookings` and `schedule` tables with proper indexes.

### Step 3: Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

**Required:**
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth client ID
  - Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Add your Vercel domain (e.g., `https://your-app.vercel.app`) to authorized origins
  - Set for: **Production**, **Preview**, and **Development**

**Optional (for email notifications):**
- `SMTP_HOST` - SMTP server (e.g., `smtp.gmail.com`)
- `SMTP_PORT` - SMTP port (e.g., `587`)
- `SMTP_USER` - Your email address
- `SMTP_PASS` - Your email password or app password
- `SMTP_FROM` - From address (defaults to SMTP_USER)
  - For Gmail: Create an [App Password](https://myaccount.google.com/apppasswords)
  - Set for: **Production** (and optionally Preview)

**Optional (for admin protection):**
- `ADMIN_SECRET` - Secret key for protecting admin panel
  - Generate a secure random string (e.g., `openssl rand -base64 32`)
  - Set for: **Production**

**Note:** `POSTGRES_URL` is automatically set when you create Vercel Postgres storage.

### Step 4: Migrate Existing Data (Optional)

If you have existing bookings in SQLite, migrate them before deploying:

1. Ensure your local `.env` has `POSTGRES_URL` from Vercel
2. Run the migration script:

```bash
npm run migrate
```

This will:
- Copy all bookings from SQLite to Postgres
- Migrate schedule configuration from `server/data/schedule.json`
- Report any conflicts or errors

**Important:** Run this only once before your first deployment.

### Step 5: Deploy to Vercel

**Option A: Deploy via Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Import Project**
3. Import your Git repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click **Deploy**

**Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow the prompts to link your project and deploy.

### Step 6: Verify Deployment

After deployment:

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test the booking flow:
   - Sign in with Google
   - Select a date and time
   - Submit a booking
3. Check that the booking appears in your database:
   - Go to Vercel Dashboard → Storage → your database → Data tab
   - Query: `SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10`
4. If email is configured, verify you received the notification

### Monitoring and Limits

**Check Usage:**
- Vercel Dashboard → your project → **Analytics** tab
- Storage → your database → **Usage** tab

**Free Tier Limits:**

**Vercel:**
- 100 GB bandwidth per month
- 100 hours serverless function execution per month
- 6,000 function invocations per day

**Vercel Postgres:**
- 256 MB storage
- 60 hours compute per month
- Automatic connection pooling

**Estimated Usage** (small barber shop):
- ~10-20 bookings/day = ~600/month
- Each booking: 3-4 API calls
- Total: ~2,400 function invocations/month (well within limits)
- Database: ~1 MB for thousands of bookings

### Troubleshooting

**Build Fails:**
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify `vercel.json` configuration is correct

**Database Connection Errors:**
- Verify `POSTGRES_URL` is set in environment variables
- Check that database tables exist (run `scripts/init-db.sql`)
- Ensure you're not exceeding connection limits

**Email Not Sending:**
- Verify all SMTP variables are set correctly
- For Gmail, ensure you're using an App Password (not your regular password)
- Check function logs in Vercel Dashboard for error messages
- Note: Bookings will still save even if email fails

**Admin Panel Not Working:**
- If `ADMIN_SECRET` is set, you must provide it when saving configuration
- Check browser console for error messages
- Verify the secret matches what's in Vercel environment variables

### Updating Your Deployment

To deploy updates:

```bash
git push
```

Vercel automatically deploys on every push to your main branch.

For preview deployments (test before production):
```bash
git checkout -b feature-branch
git push origin feature-branch
```

Vercel creates a preview URL for each branch.

### Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → your project → **Settings** → **Domains**
2. Add your domain (e.g., `booking.example.com`)
3. Follow DNS configuration instructions
4. Update Google OAuth authorized origins to include your custom domain

## Contact

- **Email:** awadhetawy@gmail.com  
- **Phone:** +962 78 780 6337
