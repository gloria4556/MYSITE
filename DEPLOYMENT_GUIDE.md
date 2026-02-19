# Free Deployment Guide

This guide covers free and low-cost deployment options for your e-commerce platform.

## Architecture Overview

Your platform has 3 components:

1. **Frontend** (React) - Static files
2. **Backend** (Django) - REST API server
3. **Admin Panel** (React) - Separate static app
4. **Database** (SQLite for dev, needs migration for prod)

---

## Option 1: Vercel + Render (RECOMMENDED - Easiest)

### Best For: Quick deployment with zero DevOps

#### Frontend Deployment (Vercel)

**Free Tier:** 100GB bandwidth/month, unlimited sites

1. Push frontend to GitHub
2. Connect Vercel: https://vercel.com
3. Link GitHub repo → Auto-deploy on push
4. Set environment variable: `REACT_APP_STRIPE_PUBLISHABLE_KEY`

**Steps:**

```bash
cd frontend
git init
git add .
git commit -m "initial commit"
git push origin main
```

Then on Vercel dashboard:

- Import project
- Link GitHub repo
- Add environment variables
- Deploy (automatic on each push)

#### Backend Deployment (Render)

**Free Tier:** 750 hours/month (covers ~24/7 for free), auto-sleep after 15 min inactivity

1. Push backend to GitHub
2. Connect Render: https://render.com
3. Create new Web Service from GitHub

**Setup on Render:**

```
Name: mysite-backend
Environment: Python 3.11
Build Command: pip install -r requirements.txt && python manage.py migrate
Start Command: gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
```

**Environment Variables on Render:**

```
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.onrender.com,yourdomain.com
DATABASE_URL=postgresql://...  (use Render's free PostgreSQL)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
CORS_ALLOWED_ORIGINS=https://yourfrontend.vercel.app
```

#### Admin Panel (Vercel)

Same as frontend, just point to admin-panel folder

#### Database (Render PostgreSQL)

- Free tier: 256MB storage
- Setup in Render dashboard → Databases → PostgreSQL
- Get connection string, add to Django settings

**Expected Cost:** $0/month (free tier), or $7/month if you want 24/7 uptime (skip auto-sleep)

---

## Option 2: Railway (Simple & Elegant)

**Free Tier:** $5 monthly free credit

### Frontend & Admin Panel (Railway)

1. Create account: https://railway.app
2. Connect GitHub
3. Deploy React app
4. Auto-builds and deploys on push

### Backend (Railway)

1. New service from GitHub (Django project)
2. Set environment variables
3. Use Railway's PostgreSQL add-on (free tier available)
4. Deploy

**Steps:**

```
1. Push code to GitHub
2. railway login
3. railway link (connect to GitHub)
4. railway up
```

**Cost:** Usually free with $5 credit, then $5/month afterward

---

## Option 3: PythonAnywhere + Netlify (Traditional)

### Backend (PythonAnywhere)

**Free Tier:** Limited but works for small projects

1. Create account: https://www.pythonanywhere.com
2. Upload Django project
3. Configure WSGI file
4. Set up web app with custom domain

**Limitations:** 100MB disk space free (need paid for more)

### Frontend (Netlify)

**Free Tier:** Unlimited bandwidth, deploys from Git

1. Push frontend to GitHub
2. Connect Netlify: https://netlify.com
3. GitHub → Deploy
4. Set environment variables

**Cost:** Free with limitations, ~$40/month for more resources

---

## Option 4: Google Cloud / AWS Free Tier

### Google App Engine (Django)

**Free Tier:** 28 instance hours/day

```bash
# Create app.yaml
runtime: python39
handlers:
- url: /.*
  script: auto
env: standard
```

Deploy:

```bash
gcloud app deploy
```

### AWS

**Free Tier:** EC2 micro instance (12 months), RDS free tier

More complex setup, requires AWS knowledge

---

## Option 5: DigitalOcean (Affordable, Not Free)

**Cost:** $4-6/month for basic droplet

- Simple deployment with SSH
- Good documentation
- App Platform for easy deployment

```bash
# Deploy with doctl
doctl apps create --spec app.yaml
```

---

## Database Migration for Production

Your current setup uses SQLite. For production:

### Option A: Use Render PostgreSQL

- Free tier: 256MB
- Included with Render deployment

Update `settings.py`:

```python
import dj_database_url

if not DEBUG:
    DATABASES['default'] = dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
else:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
```

Install:

```bash
pip install dj-database-url psycopg2-binary
```

### Option B: Use Neon PostgreSQL

- Free tier: 3 projects, 0.5GB
- Connection pooling included
- URL: https://neon.tech

### Option C: Keep SQLite for MVP

Works if you have < 1GB data, < 10 concurrent users

---

## Recommended Deployment Stack (FREE)

### Best Overall: Vercel + Render

```
Frontend: Vercel (Free)
├─ React app auto-deploys from GitHub
├─ CDN included
└─ Environment variables supported

Admin Panel: Vercel (Free)
├─ Same setup as frontend
└─ Auto-deploys

Backend: Render (Free)
├─ Django REST API
├─ Auto-deploys from GitHub
├─ PostgreSQL included (256MB)
└─ Keeps instance warm with paid plan if needed

Domain: Freenom or Namecheap
├─ Free: .tk, .ml, .ga domains (Freenom)
└─ Cheap: .com at $0.99 first year (Namecheap)
```

**Setup Process:**

1. **Prepare Code for Production**

   ```bash
   pip install gunicorn
   pip install psycopg2-binary
   pip install python-decouple
   pip freeze > requirements.txt
   ```

2. **Update Django Settings**

   ```python
   DEBUG = os.environ.get('DEBUG', 'False') == 'True'
   ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
   SECRET_KEY = os.environ.get('SECRET_KEY')
   ```

3. **Update Frontend API URL**

   ```javascript
   // In .env.production
   REACT_APP_API_URL=https://yourbackend.onrender.com
   ```

4. **Create Procfile** (for Render/Heroku-style platforms)

   ```
   web: gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
   release: python manage.py migrate
   ```

5. **Deploy to Vercel (Frontend)**

   ```bash
   npm run build
   git push origin main
   # Vercel auto-deploys
   ```

6. **Deploy to Render (Backend)**
   - Connect GitHub repo
   - Set environment variables
   - Auto-deploys on push

---

## Cost Comparison

| Service                  | Frontend  | Backend   | Database | Domain    | Monthly |
| ------------------------ | --------- | --------- | -------- | --------- | ------- |
| Vercel + Render          | Free      | Free\*    | Free     | $0 (free) | $0      |
| Railway                  | $5 credit | $5 credit | Included | $0 (free) | $0-5    |
| PythonAnywhere + Netlify | Free      | Limited   | Paid     | $0 (free) | $10+    |
| DigitalOcean             | -         | $4-6      | -        | $0 (free) | $4-6    |
| Google Cloud             | Limited   | Free\*    | Free     | $0 (free) | $0\*\*  |

\*Limited: Render free tier has auto-sleep. App wakes up on request (5-30 sec delay)
\*\*Google Cloud: Always-free tier with conditions

---

## Step-by-Step: Deploy on Vercel + Render

### 1. Create GitHub Account

- https://github.com
- Create private repository

### 2. Initialize Git

```bash
cd c:\Users\hp\OneDrive\Desktop\mysite

# Initialize Git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mysite.git
git push -u origin main
```

### 3. Deploy Frontend on Vercel

```
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import project
4. Select 'frontend' folder
5. Add env variables:
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   REACT_APP_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
6. Deploy
```

### 4. Deploy Admin Panel on Vercel

```
1. New project
2. Same repo, but select 'admin-panel' folder
3. Set environment: REACT_APP_ADMIN_API_URL=https://yourbackend.onrender.com
4. Deploy
```

### 5. Deploy Backend on Render

```
1. Go to https://render.com
2. Sign up with GitHub
3. New Web Service
4. Select backend folder
5. Set build/start commands
6. Add PostgreSQL database
7. Set environment variables
8. Deploy
```

### 6. Update CORS in Django

```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.vercel.app",
    "https://admin.yourdomainvercel.app",
    "https://yourdomain.com",
]
```

### 7. Point Domain

- Buy domain (Namecheap, Freenom)
- Point DNS to Vercel/Render
- Update ALLOWED_HOSTS in Django

---

## Checklist Before Deploying

Frontend:

- [ ] Build locally: `npm run build`
- [ ] Test with production API URL
- [ ] Update .env.production with correct URLs
- [ ] Remove debug console.logs
- [ ] Test Stripe with live keys (optional)

Backend:

- [ ] DEBUG = False
- [ ] ALLOWED_HOSTS configured
- [ ] SECRET_KEY from environment
- [ ] Database connection tested
- [ ] Email backend configured (use SendGrid free tier)
- [ ] Static files collected
- [ ] CORS properly configured

Admin Panel:

- [ ] Same as frontend
- [ ] Admin API URL updated

---

## Monitoring & Maintenance

### Errors & Logs

**Vercel:** Deployment logs in dashboard

```
Logs → Functions/Edge Logs
```

**Render:**

```
Logs → View logs in dashboard
SSH → Connect and debug
```

### Performance Monitoring

- **Sentry**: Free error tracking https://sentry.io
- **New Relic**: Free tier APM https://newrelic.com

### Backup

- GitHub is your backup (version control)
- Export database periodically

---

## Common Issues & Solutions

### CORS Errors

```
Error: No 'Access-Control-Allow-Origin'
```

**Solution:** Update CORS_ALLOWED_ORIGINS in settings.py with frontend URL

### Database Connection Errors

```
Error: Lost connection to PostgreSQL
```

**Solution:** Check DATABASE_URL environment variable, restart Render service

### Static Files Not Loading

```
Solution: Run: python manage.py collectstatic
Add to Render start command: python manage.py collectstatic --noinput
```

### Long Cold Starts

```
Render free tier + Django = 30-60 sec first request
Solution: Upgrade to paid tier for 24/7 uptime, or accept cold starts
```

---

## Next Steps

1. **Test Locally First**

   ```bash
   # Test frontend build
   cd frontend && npm run build

   # Test backend with PostgreSQL locally
   pip install psycopg2
   ```

2. **Prepare Environment Files**

   ```bash
   # Create .env files (never commit)
   BACKEND_URL=https://yourbutton.onrender.com
   STRIPE_PUBLIC_KEY=pk_live_...
   SECRET_KEY=your-40-char-random-key
   ```

3. **Set Up CI/CD**
   - GitHub Actions auto-deploys on push
   - Render auto-deploys on push
   - Vercel auto-deploys on push

4. **Monitor Performance**
   - Check cold starts
   - Monitor API response times
   - Track errors in Sentry

---

## Cost-Optimized Final Setup

For $0/month (with 5-30 sec cold starts):

- **Frontend + Admin:** Vercel Free
- **Backend:** Render Free (with auto-sleep)
- **Database:** Render PostgreSQL Free (256MB)
- **Domain:** Freenom Free (.tk/.ml/.ga)
- **Email:** Sendgrid Free (100/day)
- **Monitoring:** Sentry Free

For $5-10/month (with instant loads):

- Keep frontend/admin on Vercel Free
- Upgrade Render to paid ($7-12/month)
- Add custom domain ($10/month if paid)

**Total: Free to $20/month depending on needs**

---

## Recommended Reading

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Django Deployment: https://docs.djangoproject.com/en/6.0/howto/deployment/
- React Build Optimization: https://create-react-app.dev/docs/deployment/
