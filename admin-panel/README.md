# Admin Panel

This is a standalone React admin panel for the project. It connects to the same Django backend API and requires an admin user to log in.

Setup:

1. cd admin-panel
2. npm install
3. npm start

Notes:

- The panel expects the backend to expose the API endpoints documented in the parent project's backend (JWT login at `/api/users/login/`, token refresh at `/api/token/refresh/`, admin endpoints under `/api/users/`, `/api/products/`, `/api/orders/`).
- Admin authentication is handled via JWT stored in `localStorage` under `adminUser`.

Development notes:

- By default the main frontend (`frontend/`) will try to open the admin panel at `http://localhost:3001`. To run the admin panel locally on that port:
  1. cd into `admin-panel`
  2. install deps: `npm install`
  3. start the dev server on port 3001: (Windows CMD) `set PORT=3001 && npm start` or (PowerShell) `$env:PORT=3001; npm start` or (Unix) `PORT=3001 npm start`

- The admin panel needs to talk to the Django backend. By default the admin panel uses `http://localhost:8000` as the backend API. If your backend runs on a different host/port, set `REACT_APP_API_URL` in `admin-panel/.env` or in your environment (for example: `REACT_APP_API_URL=http://localhost:8000`). Restart the dev server after changing the env value.

- Make sure your backend allows CORS from the admin panel origin (for local dev, add `http://localhost:3001` to `CORS_ALLOWED_ORIGINS` or enable `CORS_ORIGIN_ALLOW_ALL` for convenience in development).
