# Free Telegram Notification Setup (100% FREE)

Since WhatsApp API requires paid services, I've set up Telegram notifications instead - it's completely free and works just as well!

## Why Telegram?
- ✅ 100% FREE (no costs ever)
- ✅ Instant notifications
- ✅ Works exactly like WhatsApp
- ✅ Easy 5-minute setup
- ✅ No credit card required

## Setup Steps

### Step 1: Create a Telegram Bot (2 minutes)

1. Open Telegram on your phone or computer
2. Search for **@BotFather** (official Telegram bot)
3. Start a chat and send: `/newbot`
4. Follow the prompts:
   - Choose a name for your bot (e.g., "Awad Booking Bot")
   - Choose a username (must end in 'bot', e.g., "awad_booking_bot")
5. BotFather will give you a **token** that looks like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. **Save this token** - you'll need it!

### Step 2: Get Your Chat ID (1 minute)

1. Search for your new bot in Telegram (the username you just created)
2. Start a chat with it and send any message (e.g., "Hello")
3. Open this URL in your browser (replace `<YOUR_BOT_TOKEN>` with your actual token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. You'll see JSON response. Find the `"chat":{"id":` part
5. The number after `"id":` is your **Chat ID** (e.g., `123456789`)
6. **Save this Chat ID** - you'll need it!

Example response:
```json
{
  "ok": true,
  "result": [{
    "message": {
      "chat": {
        "id": 123456789,  ← This is your Chat ID
        "first_name": "Your Name"
      }
    }
  }]
}
```

### Step 3: Add to Vercel Environment Variables

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your `barber-registry` project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   **Variable 1:**
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: Your bot token from Step 1
   - Environment: Check all (Production, Preview, Development)
   
   **Variable 2:**
   - Name: `TELEGRAM_CHAT_ID`
   - Value: Your chat ID from Step 2
   - Environment: Check all (Production, Preview, Development)

5. Click **Save**

### Step 4: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

Or just push any change to GitHub and Vercel will auto-deploy.

## Testing

After redeployment:
1. Go to your booking site
2. Make a test booking
3. You should receive a Telegram message instantly! 🎉

The message will look like:
```
🔔 New Booking Alert

📅 Date: Monday, March 15, 2024
⏰ Time: 2:30 PM
👤 Name: John Doe
📧 Email: john@example.com

Please confirm with the customer.
```

## Troubleshooting

**Not receiving messages?**
1. Make sure you sent at least one message to your bot first
2. Check that both environment variables are set in Vercel
3. Check Vercel function logs for errors
4. Make sure you redeployed after adding the variables

**Can't find Chat ID?**
- Make sure you sent a message to your bot first
- The URL must include your full bot token
- Look for `"chat":{"id":` in the JSON response

## Cost Comparison

| Service | Cost | Setup Time |
|---------|------|------------|
| **Telegram** | **FREE forever** | **5 minutes** |
| WhatsApp (Twilio) | $0.005 per message | 15 minutes |
| WhatsApp Business API | $0.01+ per message | Hours/Days |
| SMS | $0.01+ per message | 10 minutes |

## Benefits of Telegram

- No monthly fees
- No per-message costs
- Unlimited messages
- Instant delivery
- Works on all devices
- Can add multiple people to receive notifications
- Can create groups for team notifications

## Need Help?

If you have any issues, check the Vercel function logs:
1. Go to Vercel Dashboard → your project
2. Click **Deployments** → latest deployment
3. Click **Functions** tab
4. Look for `/api/booking` logs
