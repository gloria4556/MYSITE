# Render Deployment Guide - Step by Step

## Quick Overview

Your app will deploy in 3 parts:

- **Frontend** (React) → hosted on Render
- **Admin Panel** (React) → hosted on Render
- **Backend** (Django API) → hosted on Render
- **Database** (PostgreSQL) → created separately on Render

---

## Step 1: Prepare Your Repository

✅ Already done! Your code is on GitHub at `gloria4556/MYSITE`

Key files already configured:

- `render.yaml` - Service configuration
- `backend/Procfile` - Backend startup commands
- `backend/requirements.txt` - Python dependencies
- `.env` files created with defaults

---

## Step 2: Create a Render Account

1. Go to https://render.com
2. Click "Sign up"
3. **Sign up with GitHub** (recommended - lets Render auto-deploy)
4. Authorize Render to access your GitHub repositories
5. Click "Dashboard" after signing up

---

## Step 3: Deploy Using Blueprint

### Option A: Quick Deploy (Recommended)

1. In Render Dashboard, click "New +"
2. Select "**Blueprint**"
3. Paste repository URL: `https://github.com/gloria4556/MYSITE.git`
4. Click "Connect Repository"
5. Leave owner as your GitHub account
6. Click "Create Blueprint" or "Deploy"

Render will read `render.yaml` and create:

- ✅ mysite-backend (Python Django service)
- ✅ mysite-frontend (Node React service)
- ✅ mysite-admin (Node React admin service)

**Wait 5-10 minutes** for deployment to complete.

### Option B: Manual Deploy

If Blueprint doesn't work, deploy services individually:

1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Follow the steps below for each service

---

## Step 4: Create PostgreSQL Database

### Create the Database

1. In Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. **Name:** `mysite-db`
4. **Region:** Same as your backend (e.g., Ohio)
5. **PostgreSQL Version:** 15 (default)
6. Click "Create Database"

**Wait 2-3 minutes** for database to be created.

### Get Database Connection String

1. Go to Dashboard → `mysite-db`
2. Copy the **"Internal Database URL"** (looks like: `postgresql://user:password@host:5432/mysite_db`)
3. Keep this somewhere safe - you'll need it!

---

## Step 5: Configure Backend Environment Variables

**After deployment completes:**

1. Go to Dashboard → `mysite-backend`
2. Click "**Environment**" tab
3. Add these variables:

```
DEBUG=False
SECRET_KEY=<choose-a-random-50-character-string>
DATABASE_URL=<paste-your-PostgreSQL-URL-from-Step-4>
ALLOWED_HOSTS=mysite-backend.onrender.com,localhost
CORS_ALLOWED_ORIGINS=https://mysite-frontend.onrender.com,https://mysite-admin.onrender.com,http://localhost:3000,http://localhost:3001
STRIPE_PUBLIC_KEY=pk_live_your_actual_key
STRIPE_SECRET_KEY=sk_live_your_actual_key
PAYPAL_CLIENT_ID=your_paypal_id
PAYPAL_SECRET=your_paypal_secret
```

**Generate SECRET_KEY:**

Open a terminal and run:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste it as `SECRET_KEY`.

### Save and Redeploy Backend

1. Click "Save"
2. Click "Manual Deploy" → "Deploy latest"
3. **Wait 2-3 minutes** for backend to restart with new database

---

## Step 6: Configure Frontend Environment Variables

1. Go to Dashboard → `mysite-frontend`
2. Click "**Environment**" tab
3. Add:

```
REACT_APP_API_URL=https://mysite-backend.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
```

4. Click "Save"
5. Click "Manual Deploy" → "Deploy latest"
6. **Wait 1-2 minutes**

---

## Step 7: Configure Admin Panel Environment Variables

1. Go to Dashboard → `mysite-admin`
2. Click "**Environment**" tab
3. Add:

```
REACT_APP_API_URL=https://mysite-backend.onrender.com
```

4. Click "Save"
5. Click "Manual Deploy" → "Deploy latest"
6. **Wait 1-2 minutes**

---

## Step 8: Verify Everything Works

### Check Backend API

Open in browser: `https://mysite-backend.onrender.com/api/`

Should show Django REST Framework interface with all endpoints.

### Check Frontend

Open: `https://mysite-frontend.onrender.com`

Should show your main website.

### Check Admin

Open: `https://mysite-admin.onrender.com`

Should show admin login page.

### Test Connection

1. Open `https://mysite-frontend.onrender.com`
2. Open DevTools (F12)
3. Go to "Network" tab
4. Try to interact with the app
5. You should see requests to `https://mysite-backend.onrender.com/api/...`
6. All should show `200 OK` status

---

## Step 9: Create Admin Superuser

Your backend is running but you need a superuser to access `/admin/`

### Via Render Dashboard Shell

1. Go to Dashboard → `mysite-backend`
2. Click "**Shell**" (top menu)
3. Run:

```bash
cd backend
python manage.py createsuperuser
```

4. Follow prompts:
   - Username: `admin`
   - Email: `your@email.com`
   - Password: `your-secure-password` (type it twice)

5. Press Enter

### Or Use Django Admin

1. Visit `https://mysite-backend.onrender.com/admin/`
2. You might get a 404 if you haven't configured it
3. Create superuser as above

---

## Step 10: Enable Auto-Deployments from GitHub

By default, this should be enabled. To verify:

1. Go to Dashboard → any service
2. Click "**Settings**"
3. Look for "**Auto-Deploy**"
4. It should say "Yes" or "Enabled"

Now whenever you push to GitHub:

```bash
git push origin main
```

Render automatically redeploys all services! ✨

---

## Common Issues & Fixes

### ❌ Backend shows 503 Service Unavailable

**Problem:** Backend crashed or still initializing.

**Solution:**

1. Go to Backend → "Logs"
2. Look for error messages
3. Common causes:
   - `DATABASE_URL` not set
   - Migration failed
   - Syntax error in settings.py

**Fix:**

- Set `DATABASE_URL` environment variable
- Click "Manual Deploy"
- Wait 2-3 minutes

### ❌ Frontend shows "Cannot reach backend"

**Problem:** Frontend trying to call wrong API URL.

**Solution:**

1. Check `REACT_APP_API_URL=https://mysite-backend.onrender.com`
2. Frontend environment variables saved correctly
3. Redeploy frontend
4. Check browser DevTools Network tab

### ❌ Database connection failed

**Problem:** Backend can't connect to PostgreSQL.

**Solution:**

1. Verify `DATABASE_URL` environment variable on backend
2. Check database is still running: Dashboard → `mysite-db` should say "Available"
3. Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`

### ❌ Migrations failed

**Problem:** Django migrations didn't run during deployment.

**Solution:**

1. Check Backend → Logs for migration errors
2. Go to Shell: `cd backend && python manage.py migrate`
3. Check for typos in models.py

### ❌ Static files not loading (CSS/JS broken)

**Problem:** WhiteNoise not serving static files.

**Solution:**

1. Backend should have collected static files automatically
2. If not working, go to Shell and run:

```bash
cd backend
python manage.py collectstatic --noinput
```

3. Restart backend: Manual Deploy

---

## Production Checklist

Before going live, verify:

- [ ] `DEBUG=False` on backend (NOT `True`)
- [ ] `SECRET_KEY` is strong (40+ random characters)
- [ ] `DATABASE_URL` points to PostgreSQL
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] `CORS_ALLOWED_ORIGINS` restricted to your domains
- [ ] STRIPE keys are production keys (pk*live*, sk*live*)
- [ ] Frontend can call backend without errors
- [ ] Admin panel can call backend without errors
- [ ] Static files load (CSS/images appear)
- [ ] Database migrations completed successfully

---

## Add Custom Domain (Optional)

### Add Domain to Backend

1. Backend → "**Settings**"
2. Scroll to "**Custom Domain**"
3. Click "Add Domain"
4. Enter: `api.yourdomain.com`
5. Follow DNS instructions (add CNAME record)
6. Update `ALLOWED_HOSTS` to include domain
7. Update `CORS_ALLOWED_ORIGINS` to include domain

### Add Domain to Frontend

1. Frontend → "**Settings**"
2. Click "Add Domain"
3. Enter: `www.yourdomain.com` OR `yourdomain.com`
4. Follow DNS instructions

---

## Useful Commands

### Run Django Commands on Production

Go to Dashboard → Backend → "**Shell**":

```bash
# Run migrations
cd backend && python manage.py migrate

# Create superuser
cd backend && python manage.py createsuperuser

# Check database connection
cd backend && python manage.py dbshell

# Collect static files
cd backend && python manage.py collectstatic --noinput

# View logs
# Use Dashboard Logs tab instead
```

### Check Services Status

All 3 services should show:

- Status: "Live" or "Available"
- Last restart: Recently (after you last deployed)
- No errors in Logs

### Monitor Performance

Dashboard → Service → "**Metrics**"

View:

- CPU usage
- Memory usage
- Network I/O
- Request count

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## Next Steps

1. ✅ Deploy all services
2. ✅ Set environment variables
3. ✅ Test backend, frontend, and admin
4. ✅ Create superuser
5. ✅ Test payments with test keys
6. ✅ Monitor logs for errors
7. ✅ Add production payment keys
8. ✅ Add custom domain (optional)
9. ✅ Set up monitoring/alerts

You're all set! 🚀
