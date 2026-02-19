# Frontend & Backend Sync Guide

This guide explains how to run your frontend, admin panel, and Django backend together so they communicate properly.

## Architecture

```
Frontend (React)          Admin Panel (React)
   :3000                        :3001
     ↓                            ↓
     └──────────────┬─────────────┘
                    ↓
Backend (Django REST API)
        :8000
```

---

## Development Setup

### Prerequisites

- Node.js 16+ (for frontend & admin)
- Python 3.8+ (for backend)
- PostgreSQL or SQLite (comes with Django)

---

## Backend Setup (Django)

### Step 1: Set Up Python Environment

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment

Create `.env` file in `backend/` with:

```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
DATABASE_URL=
STRIPE_PUBLIC_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key
PAYPAL_CLIENT_ID=sb_client_id
PAYPAL_SECRET=sb_secret
```

### Step 4: Run Migrations

```bash
python manage.py migrate
```

### Step 5: (Optional) Create Superuser

```bash
python manage.py createsuperuser
# Enter username, email, password
```

### Step 6: Start Backend Server

```bash
python manage.py runserver
```

You should see:

```
Django version 5.0.7, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

✅ **Backend is running on `http://localhost:8000`**

---

## Frontend Setup (React)

### Step 1: Install Dependencies

Open a **NEW terminal** and navigate to frontend:

```bash
cd frontend
npm install
```

### Step 2: Create Environment File

Create `.env` file in `frontend/` with:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
REACT_APP_PAYPAL_CLIENT_ID=sb_client_id
```

### Step 3: Start Frontend Server

```bash
npm start
```

The app will open at `http://localhost:3000` automatically.

✅ **Frontend is running on `http://localhost:3000`**

---

## Admin Panel Setup (React)

### Step 1: Install Dependencies

Open a **NEW terminal** and navigate to admin-panel:

```bash
cd admin-panel
npm install
```

### Step 2: Create Environment File

Create `.env` file in `admin-panel/` with:

```
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: Start Admin Server

```bash
npm start
```

The admin panel will open at `http://localhost:3001` automatically.

✅ **Admin Panel is running on `http://localhost:3001`**

---

## Verify Everything is Connected

### Backend Check

Visit: http://localhost:8000/api/

You should see a Django REST Framework interface with all available endpoints.

### Frontend Check

Open DevTools (F12) → Network tab

- Go to http://localhost:3000
- Try to log in or interact with the app
- You should see API calls going to `http://localhost:8000/api/...`
- Calls should show `200 OK` status

### Admin Check

Open DevTools (F12) → Network tab

- Go to http://localhost:3001
- Try to log in
- You should see API calls to `http://localhost:8000/api/...`

---

## What Happens When You Click Something

### Example: Login Flow

1. **Frontend** → User enters credentials and clicks "Login"
2. **Frontend** → Makes API request to `http://localhost:8000/api/users/login/`
3. **Backend** → Receives request, validates credentials
4. **Backend** → Returns JWT token
5. **Frontend** → Stores token in localStorage
6. **Frontend** → Redirects to dashboard
7. **Frontend** → Subsequent requests include `Authorization: Bearer <token>` header

### Example: View Products

1. **Frontend** → On page load, requests products
2. **Frontend** → Makes API request to `http://localhost:8000/api/products/`
3. **Backend** → Queries database, returns products as JSON
4. **Frontend** → Displays products on page

---

## Common Issues & Fixes

### Frontend Shows "Cannot GET /api/products"

**Problem**: Frontend is trying to use relative paths instead of backend URL.

**Solution**:

- Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:8000`
- Restart frontend: `npm start`
- Check `frontend/src/utils/api.js` uses environment variable

### CORS Error: "Access to XMLHttpRequest blocked"

**Problem**: Backend isn't allowing requests from frontend.

**Solution**:

- Check `backend/.env` has `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,...`
- Restart backend: `python manage.py runserver`

### Backend Gets CSRF Token Error

**Problem**: Frontend requests need CSRF token.

**Solution**: Django REST Framework automatically handles JWT auth, shouldn't be an issue.

### Frontend Can't Connect After Restarting Backend

**Problem**: Connection dropped.

**Solution**:

- Restart frontend: `npm start`
- Check both servers are running
- Check network tab in DevTools

---

## Terminal Setup for Easy Monitoring

Here's a good setup with multiple terminals:

**Terminal 1 (Backend)**

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 (Frontend)**

```bash
cd frontend
npm start
```

**Terminal 3 (Admin)**

```bash
cd admin-panel
npm start
```

**Terminal 4 (Database - if using Postgres)**

```bash
# Optional: just for monitoring
```

---

## Development Workflow

1. **Make Backend Changes**
   - Edit `backend/base/views.py` or other files
   - Django auto-reloads
   - Test in Terminal 1 or at http://localhost:8000/api/

2. **Make Frontend Changes**
   - Edit files in `frontend/src/`
   - React auto-reloads
   - Test at http://localhost:3000

3. **Make API Connection Changes**
   - Update `frontend/src/utils/api.js` or admin API
   - Restart frontend: `Ctrl+C` then `npm start`

4. **Test End-to-End**
   - All 3 servers running
   - Open http://localhost:3000 and http://localhost:3001
   - DevTools Network tab shows requests to `http://localhost:8000/api/...`

---

## Quick Command Reference

### Start Everything

```bash
# Terminal 1: Backend
cd backend && python manage.py runserver

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Admin
cd admin-panel && npm start
```

### Stop Everything

```bash
Ctrl+C in each terminal
```

### Reset Everything

```bash
# Backend: Clear database
cd backend
rm db.sqlite3
python manage.py migrate

# Frontend: Clear cache
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start

# Admin: Clear cache
cd admin-panel
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## .env File Summary

### backend/.env

```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
```

### frontend/.env

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_PAYPAL_CLIENT_ID=...
```

### admin-panel/.env

```
REACT_APP_API_URL=http://localhost:8000
```

---

## Testing the Connection

### Test 1: Backend is Running

```bash
curl http://localhost:8000/api/
```

Should return JSON with all endpoints.

### Test 2: Frontend Can Call Backend

Open browser DevTools → Console:

```javascript
fetch("http://localhost:8000/api/products/")
  .then((r) => r.json())
  .then((d) => console.log(d));
```

Should return product list.

### Test 3: Full Flow

1. Visit http://localhost:3000
2. Open DevTools → Network
3. Click any button that makes an API call
4. See request go to `http://localhost:8000/api/...`
5. See response return successfully

---

## Next Steps

Once synchronized locally:

1. **Test all features** - Login, view products, place orders
2. **Check browser console** - No errors
3. **Check DevTools Network** - All API calls succeed
4. **Test admin panel** - Login and manage data
5. **Deploy** - Follow RENDER_DEPLOYMENT.md when ready

---

## Support

- Django Docs: https://docs.djangoproject.com/
- React Docs: https://react.dev/
- Axios Docs: https://axios-http.com/docs
