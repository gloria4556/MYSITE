# Firebase Hosting + Render Backend Deployment Guide

This guide covers deploying your React frontend (and admin panel) on Firebase Hosting and Django backend on Render.

## Why Firebase + Render?

### Advantages

✅ **Firebase Hosting:**

- Truly free tier (no credit card required for many projects)
- Global CDN included
- SSL certificates automatic
- Super fast deployments
- Perfect for static React apps

✅ **Render Backend:**

- Simple Django deployment
- Free PostgreSQL database
- Auto-deploys from GitHub
- Good free tier (750 hrs/month)

✅ **Together:**

- Both have excellent free tiers
- No credit card needed for start
- Auto-deployments from Git
- Production-ready setup
- Total cost: $0-10/month

---

## Architecture

```
User Browser
    ↓
Firebase Hosting (Frontend + Admin Panel)
    ├─ https://yourapp.web.app (main app)
    ├─ https://admin.yourapp.web.app (admin panel)
    └─ API calls to ↓

Render Backend
    ├─ https://yourapp-backend.onrender.com (Django REST API)
    └─ Connected to ↓

Render PostgreSQL Database
    └─ Persistent data storage
```

---

## Part 1: Setup Firebase

### Step 1: Create Firebase Project

1. Go to https://firebase.google.com
2. Click "Go to console"
3. Click "Create a project"
4. Enter project name: `mamigloexclusive`
5. Accept terms, disable analytics (for free tier), create project
6. Wait for creation (2-3 minutes)

### Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify:

```bash
firebase --version
```

### Step 3: Authenticate Firebase

```bash
firebase login
```

Opens browser, sign in with your Google account, authorize Firebase CLI.

### Step 4: Initialize Firebase in Project

In your workspace root:

```bash
firebase init hosting
```

When prompted:

```
? Select a default Firebase project: mamigloexclusive

? What do you want to use as your public directory? frontend/build

? Configure as a single-page app (rewrite all URLs to index.html)? Y

? Set up automatic builds and deploys with GitHub? Y

? Connect to GitHub? (authorize)

? Which GitHub repository? YOUR_USERNAME/mysite

? Set up automatic GitHub action deploys? Y
```

This creates:

- `.firebaserc` - Firebase configuration
- `firebase.json` - Hosting config
- `.github/workflows/firebase-hosting-pull-request.yml` - Auto-deploy on PR
- `.github/workflows/firebase-hosting-merge.yml` - Auto-deploy on merge to main

### Step 5: Build Frontend

```bash
cd frontend
npm run build
cd ..
```

Creates `frontend/build/` folder

### Step 6: Deploy to Firebase

```bash
firebase deploy --only hosting
```

First deploy takes 1-2 minutes. You'll see:

```
Hosting URL: https://mamigloexclusive.web.app
Hosting URL: https://mamigloexclusive.firebaseapp.com
```

**Your frontend is now live!** 🎉

---

## Part 2: Setup Render Backend

### Step 1: Prepare Django for Production

Create `requirements.txt` in `backend/` folder:

```bash
cd backend
pip freeze > requirements.txt
cd ..
```

Add these packages to `requirements.txt`:

```
gunicorn==21.2.0
psycopg2-binary==2.9.9
python-decouple==3.8
dj-database-url==2.1.0
whitenoise==6.6.0
```

Update `backend/backend/settings.py`:

```python
from pathlib import Path
import os
from decouple import config
import dj_database_url

# ... existing code ...

# Security: Load from environment
DEBUG = config('DEBUG', default='False') == 'True'
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Database: Use PostgreSQL in production
if config('DATABASE_URL', default=None):
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL'),
            conn_max_age=600
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS - Allow Firebase hosting
CORS_ALLOWED_ORIGINS = [
    "https://mamigloexclusive.web.app",
    "https://mamigloexclusive.firebaseapp.com",
    "http://localhost:3000",
]

# Email configuration (SendGrid free tier)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Change to SMTP later

# Stripe keys from environment
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLIC_KEY', default='')
```

Create `Procfile` in `backend/` folder:

```
web: gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Click "Dashboard"

### Step 3: Create PostgreSQL Database

1. Click "New +" button → PostgreSQL
2. Enter name: `mamigloexclusive-db`
3. Select region closest to you
4. Click "Create Database"
5. Copy the database URL (you'll use it in backend setup)

### Step 4: Deploy Backend

1. Click "New +" → Web Service
2. Connect to your GitHub repository
3. Fill in details:

```
Name: mamigloexclusive-backend
Environment: Python 3.11
Build Command:
pip install -r backend/requirements.txt && cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput

Start Command:
cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
```

4. Click "Advanced" → Change root directory to: `backend`

5. Add Environment Variables:

```
DEBUG=False
SECRET_KEY=your-40-character-random-string-here
ALLOWED_HOSTS=mamigloexclusive-backend.onrender.com,localhost
DATABASE_URL=postgresql://...  (paste from PostgreSQL database)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=[
    "https://mamigloexclusive.web.app",
    "https://mamigloexclusive.firebaseapp.com"
]
```

6. Click "Create Web Service"

Wait for deployment (2-5 minutes). You'll see:

```
Service is live at https://mamigloexclusive-backend.onrender.com
```

**Your backend is now live!** 🎉

---

## Part 3: Connect Frontend to Backend

### Step 1: Update Frontend API URL

Create `frontend/.env.production`:

```
REACT_APP_API_URL=https://mamigloexclusive-backend.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_id
```

Update `frontend/src/utils/api.js`:

```javascript
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: baseURL,
  headers: { "Content-Type": "application/json" },
});
```

### Step 2: Update Admin Panel

Create `admin-panel/.env.production`:

```
REACT_APP_API_URL=https://mamigloexclusive-backend.onrender.com
REACT_APP_ADMIN_PANEL_URL=https://mamigloexclusive.web.app/admin
```

### Step 3: Rebuild and Redeploy

```bash
cd frontend
npm run build
cd ..

firebase deploy --only hosting
```

(Admin panel auto-deploys)

---

## Part 4: Custom Domain (Optional)

### Add Custom Domain to Firebase

1. Firebase Console → Hosting → Add custom domain
2. Enter your domain (e.g., `mamigloexclusive.com`)
3. Add DNS records shown in Firebase (usually CNAME or A records)
4. Wait for DNS propagation (5-48 hours)
5. Firebase auto-generates SSL certificate

### Update Django Settings

Add to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`:

```python
ALLOWED_HOSTS = [
    'mamigloexclusive.com',
    'www.mamigloexclusive.com',
    'mamigloexclusive-backend.onrender.com',
]

CORS_ALLOWED_ORIGINS = [
    'https://mamigloexclusive.com',
    'https://www.mamigloexclusive.com',
    'https://mamigloexclusive.web.app',
]
```

Deploy to Render with updated settings.

---

## Step-by-Step Deployment Summary

### Initial Setup (One-time)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase
firebase init hosting

# 4. Test locally
cd frontend && npm start
cd backend && python manage.py runserver

# 5. Build frontend
cd frontend && npm run build

# 6. Deploy frontend
firebase deploy --only hosting

# 7. Setup Render backend (via Render dashboard)
# - Create PostgreSQL database
# - Create Web Service
# - Set environment variables
# - Deploy
```

### After Each Code Change

```bash
# Frontend changes
cd frontend
npm run build
firebase deploy --only hosting

# Backend changes
git push origin main
# Render auto-deploys on push

# Admin panel
git push origin main
# Firebase auto-deploys on GitHub Actions workflow
```

---

## Deployment Checklist

### Before First Deploy

**Frontend:**

- [ ] `.env.production` created with correct API URL
- [ ] `npm run build` completes without errors
- [ ] Build directory `frontend/build/` exists
- [ ] Firebase CLI installed and authenticated

**Backend:**

- [ ] `requirements.txt` generated
- [ ] `Procfile` created
- [ ] `settings.py` has environment variables
- [ ] GitHub repo contains both frontend and backend
- [ ] PostgreSQL database created in Render

**Environment Variables - Render:**

```
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=mamigloexclusive-backend.onrender.com
DATABASE_URL=postgresql://user:pass@host/db
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
CORS_ALLOWED_ORIGINS=https://mamigloexclusive.web.app,https://mamigloexclusive.firebaseapp.com
```

### After Deploy

- [ ] Frontend loads: https://mamigloexclusive.web.app
- [ ] Admin panel loads: https://mamigloexclusive-admin.web.app
- [ ] API calls work: Check Network tab in DevTools
- [ ] No CORS errors
- [ ] Login works
- [ ] Payment processing works (test cards)
- [ ] PDF download works
- [ ] Order creation works

---

## Updating Firebase Hosting to Multiple Sites

If you want separate URLs for frontend + admin:

### Option 1: Separate Firebase Sites

1. Firebase Console → Hosting → Add another site
2. Name it `mamigloexclusive-admin`
3. Deploy admin panel to it separately

Update `firebase.json`:

```json
{
  "hosting": [
    {
      "target": "main",
      "public": "frontend/build",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "admin",
      "public": "admin-panel/build",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

Deploy both:

```bash
firebase deploy --only hosting:main
firebase deploy --only hosting:admin
```

### Option 2: Single Site with Routing

Keep both apps on `mamigloexclusive.web.app`:

```
/              → Frontend (React Router)
/admin         → Admin Panel
/api           → Backend API
```

Update `firebase.json`:

```json
{
  "hosting": {
    "public": "frontend/build",
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "https://mamigloexclusive-backend.onrender.com"
      },
      {
        "source": "/admin/**",
        "destination": "/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Cost Summary

| Service                | Free Tier       | Cost         |
| ---------------------- | --------------- | ------------ |
| **Firebase Hosting**   | Unlimited       | $0\*         |
| **Render Web Service** | 750 hrs/month   | $0\*         |
| **Render PostgreSQL**  | 256MB           | $0\*         |
| **Domain**             | Free (.web.app) | $0           |
| **SSL Certificate**    | Included        | $0           |
| **CDN**                | Included        | $0           |
| **TOTAL**              | -               | **$0/month** |

\*Free tier with some limitations (Render auto-sleeps after 15 min). Upgrade to $7/month for always-on.

---

## Monitoring & Debugging

### Firebase Issues

Check logs:

```bash
firebase serve  # Test locally
firebase deploy --debug  # Verbose output
```

Monitor:

- Firebase Console → Hosting → Usage
- Check for deployment errors → Deployments tab

### Render Issues

Render Dashboard → Web Service → Logs

- View real-time logs
- Check deployment errors
- View runtime errors

### API Issues

Browser DevTools → Network tab:

- Check request/response headers
- Verify CORS headers
- Check response status codes

Common fix:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://mamigloexclusive.web.app",
    "http://localhost:3000",
]
```

---

## Troubleshooting

### CORS Error on Frontend

```
Error: No 'Access-Control-Allow-Origin' header
```

**Fix:**

1. Check `CORS_ALLOWED_ORIGINS` in Django settings
2. Ensure Firebase hosting URL is listed
3. Restart Render backend
4. Clear browser cache

### Firebase Deploy Fails

```
Error: Build step failed / Cannot find 'build' directory
```

**Fix:**

```bash
cd frontend
npm run build
cd ..
firebase deploy
```

### Render Database Won't Connect

```
Error: Lost connection to PostgreSQL
```

**Fix:**

1. Check DATABASE_URL environment variable
2. Ensure PostgreSQL database is running (Render dashboard)
3. Restart web service

### Cold Starts on Render

App takes 30-60 seconds to respond after inactivity

**Fix:**

- Upgrade Render plan to $7/month for 24/7 uptime
- Or accept cold starts (free tier)

---

## Production Checklist

- [ ] Remove DEBUG=True from settings
- [ ] Generate strong SECRET_KEY
- [ ] Set ALLOWED_HOSTS correctly
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Update API URLs in frontend
- [ ] Test all payment methods with live keys
- [ ] Test user authentication (login/logout)
- [ ] Test order creation and PDF download
- [ ] Test admin panel
- [ ] Setup error monitoring (Sentry)
- [ ] Setup email notifications (SendGrid)
- [ ] Test on mobile/tablet
- [ ] Test cross-browser compatibility

---

## Getting Help

**Firebase:**

- https://firebase.google.com/docs/hosting
- Stack Overflow: `firebase-hosting` tag

**Render:**

- https://render.com/docs
- Discord: Render support community

**Django Deployment:**

- https://docs.djangoproject.com/en/6.0/howto/deployment/

**React Deployment:**

- https://create-react-app.dev/docs/deployment/

---

## Next Steps

1. Create Firebase project (5 mins)
2. Install Firebase CLI (2 mins)
3. Deploy frontend (2 mins)
4. Create Render account (2 mins)
5. Create PostgreSQL database (2 mins)
6. Deploy backend (5 mins)
7. Test everything (10 mins)

**Total time: ~30 minutes to production!**
