# De Las Armas Catering - Supabase + Vercel Migration Complete

## Setup Instructions

### 1. Supabase
- Create new project at [supabase.com](https://supabase.com)
- Copy **Project URL** and **anon/public key** to `.env`:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
```
- Go to SQL Editor → Run `database/supabase_schema.sql`
- Create Storage bucket `profile_pics` (public)

### 2. Local Development
```
npm install
node app.js
```
- Main: http://localhost:3001
- Admin: http://localhost:4000
- Migrate old uploads/ to Supabase Storage manually

### 3. Deploy to Vercel
```
npm i -g vercel
vercel login
vercel
```
- Add env vars in Vercel Dashboard
- Auto-deploys on git push (if connected)

### 4. Data Migration (Optional)
Export old MySQL data, import to Supabase via CSV or pg_dump/pg_restore.

### Features Migrated
- Custom auth/OTP
- Cart/orders/sales/reservations
- Admin dashboard/calendar
- Reviews/uploads (multer → Storage next)

## Todo Remaining
- Migrate uploads to Supabase Storage
- Full app.js API migration (placeholders → full Supabase queries)
- RLS policies
- Test Vercel deploy
