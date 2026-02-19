# Render Deployment Guide - Complete Setup

This guide covers deploying both the frontend, admin panel, and Django backend to Render with a PostgreSQL database.

## Architecture

```
User Browser
    ↓
Render (Web Services)
    ├─ Frontend React App (mysite-frontend)
    ├─ Admin Panel React App (mysite-admin)
    └─ Backend Django API (mysite-backend)
            ↓
    PostgreSQL Database (mysite-db)
```

---

## Part 1: Prepare Your Repository

### Step 1: Commit All Changes

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Verify Files Created

The deployment files have been created:

- `render.yaml` - Complete service and database configuration
- `backend/Procfile` - Backend startup instructions
- `backend/.env.example` - Environment variables template
- `backend/requirements.txt` - Updated with production packages
- `frontend/.env.example` - Frontend environment template
- `admin-panel/.env.example` - Admin panel environment template

---

## Part 2: Setup Render Account

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended for auto-deployments)
3. Click "Dashboard"

### Step 2: Connect GitHub Repository

1. In Render Dashboard, click "New +" → "Blueprint"
2. Select "Public Git Repository"
3. Enter: `https://github.com/gloria4556/MYSITE.git`
4. Click "Connect"

---

## Part 3: Deploy with Blueprint

### Step 1: Use render.yaml Configuration

Render will automatically detect `render.yaml` and allow you to deploy all services at once.

1. Click "Create New" on the Blueprint page
2. Review the services:
   - **mysite-backend** - Django backend API
   - **mysite-frontend** - Main React app
   - **mysite-admin** - Admin panel
   - **mysite-db** - PostgreSQL database

3. Click "Deploy"

### Step 2: Wait for Initial Deployment

Render will create all services (takes 5-10 minutes):

```
Building...
Deployed ✓
```

---

## Part 4: Set Environment Variables

After initial deployment, you need to configure environment variables.

### Backend Environment Variables

1. Go to Dashboard → `mysite-backend` service
2. Click "Environment" tab
3. Set these variables:

```
DEBUG=False
SECRET_KEY=<generate-random-40-char-string>
DATABASE_URL=<auto-filled from PostgreSQL>
ALLOWED_HOSTS=mysite-backend.onrender.com,localhost
CORS_ALLOWED_ORIGINS=https://mysite-frontend.onrender.com,https://mysite-admin.onrender.com,http://localhost:3000,http://localhost:3001
STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
```

**Note:** The `SECRET_KEY` should be a long random string. Generate one:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Frontend Environment Variables

1. Go to Dashboard → `mysite-frontend` service
2. Click "Environment" tab
3. Set:

```
REACT_APP_API_URL=https://mysite-backend.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

4. Go to Dashboard → `mysite-admin` service
5. Set:

```
REACT_APP_API_URL=https://mysite-backend.onrender.com
```

### Step 3: Redeploy Services

1. In `mysite-backend`, click "Manual Deploy" → "Deploy latest"
2. In `mysite-frontend`, click "Manual Deploy" → "Deploy latest"
3. In `mysite-admin`, click "Manual Deploy" → "Deploy latest"

Wait for each to complete (2-3 minutes each).

---

## Part 5: Verify Deployment

### Check Backend API

Visit: `https://mysite-backend.onrender.com/api/`

Should see Django REST Framework interface.

### Check Frontend

Visit: `https://mysite-frontend.onrender.com`

Should load your React app.

### Check Admin Panel

Visit: `https://mysite-admin.onrender.com`

Should load admin panel.

### Check Database Connection

In backend service logs, you should see:

```
System check identified no issues (X silenced).
```

---

## Part 6: Production Checklist

### Backend Security

- [ ] DEBUG=False in production
- [ ] SECRET_KEY is secure and random (40+ characters)
- [ ] DATABASE_URL is from PostgreSQL
- [ ] ALLOWED_HOSTS includes your Render domain
- [ ] CORS_ALLOWED_ORIGINS is restricted to your domains

### Database Migrations

Migrations run automatically in the `release` phase. To verify:

1. Go to `mysite-backend` → "Logs"
2. Search for "Running migrations"
3. Should show: `Applying base.0010_order_tracking... OK`

### Static Files

- [ ] Static files generated (`whitenoise` handles this automatically)
- [ ] CSS/JS/images load on frontend without errors

---

## Part 7: Set Custom Domains (Optional)

### Add Custom Domain to Backend

1. Go to `mysite-backend` → "Settings"
2. Click "Add Custom Domain"
3. Enter: `api.yourdomain.com`
4. Follow DNS instructions
5. Update `CORS_ALLOWED_ORIGINS` with your new domain

### Add Custom Domain to Frontend

1. Go to `mysite-frontend` → "Settings"
2. Click "Add Custom Domain"
3. Enter: `www.yourdomain.com` or `yourdomain.com`
4. Follow DNS instructions

---

## Part 8: Troubleshooting

### Backend Not Starting

Check logs:

```
1. Click mysite-backend → Logs
2. Search for errors
3. Common issues:
   - DATABASE_URL missing
   - SECRET_KEY not set
   - ALLOWED_HOSTS doesn't include Render domain
```

### Frontend Can't Connect to Backend

1. Check CORS_ALLOWED_ORIGINS includes frontend domain
2. Check REACT_APP_API_URL matches backend domain
3. Redeploy frontend

### Database Connection Failed

1. Verify DATABASE_URL is correct
2. Check PostgreSQL service is running
3. Restart PostgreSQL: Dashboard → mysite-db → "Restart"

### Static Files Not Loading

1. Restart backend service
2. Check `STATIC_ROOT` path in settings.py
3. Verify migrations ran successfully

---

## Part 9: GitHub Auto-Deployment

With GitHub connection, deployment is automatic:

1. **Frontend**: Push to main → auto-deploys
2. **Backend**: Push to main → auto-deploys
3. **Admin**: Push to main → auto-deploys

To test:

```bash
echo "# Test" >> README.md
git add .
git commit -m "test auto-deploy"
git push origin main
```

Check Render Dashboard → each service will show "Deploying..." → "Deployed"

---

## Part 10: Monitoring & Logs

### View Logs

1. Click service name
2. Click "Logs" tab
3. Choose timeframe

### Monitor Performance

1. Click service → "Metrics"
2. Check CPU, Memory, Network usage
3. Free tier: 750 hours/month per service

### Get Alerts

1. Dashboard → Settings
2. Enable email notifications
3. Get alerts on service issues

---

## Useful Commands for Debugging

### Via Render Dashboard

1. Click service → "Shell"
2. Run debugging commands:

```bash
# Check environment variables
env | grep REACT_APP

# Check if backend is running
curl http://localhost:8000/api/

# Check database connection
python manage.py dbshell

# Run migrations manually
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser
```

---

## Next Steps

1. **Test your deployment** at the live URLs
2. **Verify payments** with test keys before going live
3. **Monitor logs** for errors
4. **Set up alerts** in Render dashboard
5. **Plan scaling** if needed (upgrade from free tier)

---

## Support

- **Render Docs**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/5.0/howto/deployment/
- **React Build**: https://create-react-app.dev/docs/deployment/

---

Generated: $(date)
