# 🚨 CRITICAL NEXT STEPS — COMPLETE THESE NOW

## ✅ COMPLETED (API CODE FIXES)

These endpoints have been fixed with authentication and ownership verification:

**Core Bot Management:**
- ✅ `/app/api/bots/route.js` — GET/PATCH/DELETE now require auth() and userId
- ✅ `/app/api/bots/[id]/route.js` — GET/PUT now verify bot ownership
- ✅ `/app/api/create-bot/route.js` — POST/GET now require auth()

**Configuration & Settings:**
- ✅ `/app/api/config/route.js` — GET/POST now require auth(), sensitive tokens masked
- ✅ `/app/api/settings/autofill/route.js` — POST now requires auth()

**Analytics & Telemetry:**
- ✅ `/app/api/analytics/route.js` — GET/DELETE now require auth()

**Knowledge Base:**
- ✅ `/app/api/knowledge/route.js` — GET/POST/PATCH/DELETE all require auth()

**Appointments & Booking:**
- ✅ `/app/api/appointments/route.js` — GET/POST/PATCH/DELETE/PUT all require auth()

**Chat & Testing:**
- ✅ `/app/api/chat/route.js` — POST now requires auth()

**Autofill (Bot Creation):**
- ✅ `/app/api/create-bot/autofill/route.js` — POST now requires auth()

**WhatsApp Profile & Web Scraping:**
- ✅ `/app/api/whatsapp-profile/route.js` — GET/POST now require auth()
- ✅ `/app/api/scrape/route.js` — POST now requires auth()

**Infrastructure:**
- ✅ `.env.local` — Added Supabase variables (placeholders) and USE_SUPABASE=true flag
- ✅ `SUPABASE_RLS_SETUP.sql` — Complete RLS policy script created (11 tables covered)

---

## 🔴 REMAINING: SUPABASE CONFIGURATION (YOU MUST DO THIS)

### 1. Get your Supabase credentials

1. Go to **supabase.com** and log in
2. Select your **botflow** project
3. Click **Settings** (bottom left sidebar)
4. Click **API** tab
5. Copy these values:
   - **Project URL** → Paste as `SUPABASE_URL` in `.env.local`
   - **Service Role Key** (labeled "secret") → Paste as `SUPABASE_SERVICE_KEY` in `.env.local`

⚠️ **CRITICAL:** Never expose the Service Role Key in the browser or client code!

### 2. Update `.env.local` with real values

Edit `C:\Users\18582\Desktop\ai-apps\botflow\.env.local` and replace:
- `SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co` → Your actual URL from above
- `SUPABASE_SERVICE_KEY=eyJhbGciOi...` → Your actual Service Role Key
- `META_APP_SECRET=your_meta_app_secret_here` → Get from Meta for Webhooks (app id)
- `WA_VERIFY_TOKEN=your_random_verify_token_here` → Any random string you generate

Generated values already in `.env.local`:
- `ENCRYPTION_KEY` ✅ (f8a2e1b9c3d7f4a8...)
- `WEBHOOK_SECRET` ✅ (7b8a9c0d1e2f3a4b...)
- `USE_SUPABASE=true` ✅

### 3. Execute RLS Policies in Supabase

1. Still in your Supabase dashboard
2. Click **SQL Editor** (left sidebar, or press `⌘+K` / `Ctrl+K`)
3. Click **New Query**
4. Open file: `C:\Users\18582\Desktop\ai-apps\botflow\SUPABASE_RLS_SETUP.sql`
5. Copy **entire file content**
6. Paste into the SQL Editor in Supabase
7. Click **Run** (blue button, top right)
8. Wait for success ✅ — should show "Success" with no errors

**Verification after RLS setup:**
- Go back to **SQL Editor**
- Run this query:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' ORDER BY tablename;
  ```
- Every table should show `true` in the `rowsecurity` column

---

## 🌐 DEPLOYMENT: VERCEL ENVIRONMENT VARIABLES

After `.env.local` is configured locally and RLS is enabled in Supabase:

1. Go to **vercel.com** → Your project → **Settings** → **Environment Variables**
2. Add **these exact variables** (copy from your `.env.local`):

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_SERVICE_KEY` | Your service role key |
| `ENCRYPTION_KEY` | f8a2e1b9c3d7f4a8e2b5c8d1f4a7e0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1 |
| `WEBHOOK_SECRET` | 7b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b |
| `USE_SUPABASE` | true |
| `META_APP_SECRET` | Your Meta app secret |
| `WA_VERIFY_TOKEN` | Your verify token |

3. **DO NOT** re-add Clerk keys — they're already there

---

## ✅ TESTING MULTI-TENANCY ISOLATION

After deployment:

1. **Open 2 browser windows** (or incognito)
2. **User A:** Sign in as `user1@test.com` → Create Bot1 via `/dashboard/create-bot`
3. **User B:** Sign in as `user2@test.com` in the second window
4. **Verify:** User B **cannot see** User A's Bot1
5. **Test API directly:**
   - User A gets token: `POST /api/auth/token` (if implemented)
   - Try to GET `/api/bots/bot1-id` with User B's token → Should return **403 Forbidden**
   - Try to DELETE `/api/bots/bot1-id` with User B's token → Should return **403 Forbidden**

---

## 📋 SECURITY CHECKLIST

- [ ] Supabase credentials added to `.env.local`
- [ ] RLS policies executed in Supabase SQL Editor
- [ ] `USE_SUPABASE=true` set in `.env.local`
- [ ] Environment variables added to Vercel
- [ ] Local `npm run dev` tested — check console for no SUPABASE errors
- [ ] Multi-tenancy isolation verified with 2 test users
- [ ] Webhook endpoint (`/api/webhook`) tested with Meta WhatsApp

---

## 🚀 AFTER COMPLETION

1. Push code to GitHub
2. Vercel auto-deploys when you merge/push to main
3. Monitor logs: **Vercel Dashboard** → **Deployments** → **Functions** tab
4. Check for errors related to `SUPABASE_` variables

---

## ⚠️ IF YOU GET ERRORS

**"SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"**
- Solution: `.env.local` is missing real values. Go back to Step 1 and copy actual credentials.

**"RLS policy violation" when trying to fetch bots**
- Solution: RLS policies were not executed. Go to Supabase SQL Editor and run `SUPABASE_RLS_SETUP.sql` again.

**"Bot not found or unauthorized" (403) when accessing own bots**
- Solution: `user_id` mismatch in database. The bot's `user_id` column doesn't match `auth.uid()`. Check that `getBots(userId)` is being called with the correct userId from `auth()`.

---

## 📞 SUPPORT

If something breaks:
1. Check server logs: `npm run dev` → look at terminal output
2. Check Supabase logs: **Supabase Dashboard** → **Logs** → **Functions**
3. Verify `.env.local` has real values (not placeholders)
4. Make sure RLS is `true` for all tables (run the verification query)

---

## 🎯 SUMMARY OF ALL FIXES APPLIED

**Total endpoints secured: 12+**

| Endpoint | Methods Fixed | Auth Check | Notes |
|----------|---------------|-----------|-------|
| `/api/bots` | GET, PATCH, DELETE | ✅ userId | Bot ownership verified |
| `/api/bots/[id]` | GET, PUT | ✅ userId | Bot ownership verified |
| `/api/create-bot` | POST, GET | ✅ userId | New bots tied to userId |
| `/api/config` | GET, POST | ✅ userId | Tokens masked in GET response |
| `/api/analytics` | GET, DELETE | ✅ userId | Data reset protected |
| `/api/knowledge` | GET, POST, PATCH, DELETE | ✅ userId | File management protected |
| `/api/appointments` | GET, POST, PATCH, DELETE, PUT | ✅ userId | Sheets access protected |
| `/api/chat` | POST | ✅ userId | Test chat protected |
| `/api/settings/autofill` | POST | ✅ userId | Web scraping protected |
| `/api/create-bot/autofill` | POST | ✅ userId | Bot wizard scraping protected |
| `/api/whatsapp-profile` | GET, POST | ✅ userId | Profile updates protected |
| `/api/scrape` | POST | ✅ userId | Web scraping protected |

**Public endpoints (unchanged, as intended):**
- `/api/booking-config` — returns public booking form config only
- `/api/booking-slots` — returns available appointment slots for public booking
- `/api/subscription` — returns FREE plan for unauthenticated, actual plan for authenticated
- `/api/webhook` — WhatsApp webhook (signature-verified, not Clerk auth)
- Stripe endpoints — webhook signature verification only

---

## ✨ WHAT YOU DO NOW

1. **Get Supabase credentials** from supabase.com
2. **Populate `.env.local`** with real SUPABASE_URL and SUPABASE_SERVICE_KEY
3. **Run the RLS SQL script** in Supabase SQL Editor
4. **Add env vars to Vercel** (Vercel Dashboard → Settings → Environment Variables)
5. **Test locally** with `npm run dev`
6. **Deploy** with `git push` (Vercel auto-deploys)
7. **Verify multi-tenancy** with 2 test users in separate browsers
