# Recent Changes

## Summary
Three enhancements have been made to improve the booking experience and notification system:

1. **Filter Past Time Slots** - Users can no longer select time slots that have already passed today
2. **Remove Date Restrictions** - Users can now navigate to any date (past or future) for booking
3. **WhatsApp Notifications** - Barber receives WhatsApp notifications for new bookings

---

## 1. Filter Past Time Slots

### What Changed
The slots API now filters out time slots that have already passed for the current day.

### Files Modified
- `api/slots.js` - Added logic to compare current time with available slots

### How It Works
- When a user selects today's date, the system checks the current time
- Only time slots that are in the future are shown
- For future dates, all slots are shown as normal

### Example
If it's currently 2:30 PM:
- ✅ 3:00 PM, 3:30 PM, 4:00 PM (available)
- ❌ 12:00 PM, 1:00 PM, 2:00 PM (filtered out)

---

## 2. Remove Date Restrictions

### What Changed
The date navigation now allows users to go back to previous weeks, not just forward.

### Files Modified
- `client/src/i18n/translations.js` - Updated `getOpenDates()` documentation to support negative offsets

### How It Works
- Users can click "Previous week" to see past dates
- Users can click "Next week" to see future dates
- The system still respects vacation ranges and closed days

### Note
While users can select past dates, the time slot filtering (change #1) ensures they can't book times that have already passed.

---

## 3. Telegram/WhatsApp Notifications

### What Changed
Added notification support to alert the barber when new bookings are made. Supports both Telegram (100% FREE) and WhatsApp (paid via Twilio).

### Files Created
- `lib/whatsapp.js` - Notification utility (supports Telegram and WhatsApp)
- `lib/whatsapp.test.js` - Test suite for notification functionality (5 tests)
- `TELEGRAM_SETUP.md` - Complete setup guide for free Telegram notifications

### Files Modified
- `api/booking.js` - Integrated notification into booking flow
- `README.md` - Documented notification setup

### How It Works
1. When a booking is created, the system sends notifications via Telegram or WhatsApp
2. Telegram is prioritized (100% free, no costs ever)
3. Falls back to WhatsApp if Telegram is not configured
4. If neither is configured, bookings still work but no notifications are sent

### Configuration Options

#### Option 1: Telegram (FREE - Recommended)
Add to Vercel environment variables:
```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

See `TELEGRAM_SETUP.md` for complete 5-minute setup guide.

#### Option 2: WhatsApp via Twilio (Paid)
Add to Vercel environment variables:
```
WHATSAPP_NUMBER=+962777262605
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=your-twilio-number
```

### Why Telegram?
- ✅ 100% FREE forever (no per-message costs)
- ✅ Instant notifications
- ✅ Works exactly like WhatsApp
- ✅ 5-minute setup
- ✅ No credit card required
- ✅ Unlimited messages

### Message Format
```
🔔 New Booking Alert

📅 Date: Monday, March 15, 2024
⏰ Time: 2:30 PM
👤 Name: John Doe
📧 Email: john@example.com

Please confirm with the customer.
```

---

## Testing

All changes are fully tested:
- **Total Tests**: 97 (all passing)
- **New Tests**: 5 notification tests (Telegram + WhatsApp)
- **Coverage**: Slots filtering, date navigation, notification formatting

Run tests:
```bash
npm test
```

---

## Deployment

To deploy these changes to Vercel:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add past time filtering, date navigation, and Telegram notifications"
   git push
   ```

2. **Set Up Telegram (5 minutes - 100% FREE)**:
   - Follow the complete guide in `TELEGRAM_SETUP.md`
   - Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to Vercel environment variables

3. **Redeploy** (automatic on push, or manual):
   - Vercel will automatically deploy when you push to GitHub
   - Or manually redeploy from Vercel Dashboard → Deployments

---

## User Experience Improvements

### Before
- ❌ Could select past time slots (confusing)
- ❌ Could only navigate forward in time
- ❌ Only email notifications

### After
- ✅ Only future time slots are selectable
- ✅ Can navigate to any date (past or future)
- ✅ FREE Telegram notifications (or paid WhatsApp)
- ✅ Better booking experience overall
