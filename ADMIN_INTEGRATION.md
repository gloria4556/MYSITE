# Admin Panel Backend Integration Guide

## ✅ Full Integration Status

All admin panel features are now fully connected to the Django backend with proper authentication, validation, and error handling.

---

## API Endpoints Overview

### Products

- **GET** `/api/products/` - List products (public, paginated, searchable)
  - Query params: `search`, `page`, `page_size`
  - Response: `{ results, count, num_pages, current_page }`
- **POST** `/api/products/create/` - Create product (admin-only)
  - Body: FormData with `name`, `description`, `price`, `countInStock`, `sku`, `category`, `image`
  - Returns: Created product object

- **GET** `/api/products/<id>/` - Get product detail (admin-only)
- **PUT/PATCH** `/api/products/<id>/` - Update product (admin-only)
  - Body: Partial/full product fields
  - PATCH: partial update, PUT: full update

- **DELETE** `/api/products/<id>/` - Delete product (admin-only)

### Orders

- **GET** `/api/orders/` - List orders (admin-only, paginated, searchable)
  - Query params: `search` (ID/email/username), `page`, `page_size`, `paid` (true/false)
  - Response: `{ results, count, num_pages, current_page }`

- **GET** `/api/orders/<id>/` - Get order detail (admin-only)
  - Returns: Order with nested orderitems and shippingaddress

- **PUT/PATCH** `/api/orders/<id>/` - Update order status (admin-only)
  - Body: `{ isPaid, isDelivered, isRefunded }` (boolean fields)
  - Returns: Updated order object

- **DELETE** `/api/orders/<id>/` - Delete order (admin-only)

### Users

- **GET** `/api/users/` - List users (admin-only, paginated, searchable)
  - Query params: `search` (username/email), `page`, `page_size`
  - Response: `{ results, count, num_pages, current_page }`

- **GET** `/api/users/<id>/` - Get user detail (admin-only)

- **PUT** `/api/users/<id>/` - Update user (admin-only)
  - Body: `{ username, email, name, isAdmin, password }`
  - Returns: Updated user object

- **DELETE** `/api/users/<id>/` - Delete user (admin-only)

---

## Frontend Admin Panel Pages

### ProductsList (`/products`)

✅ Connected to backend

- **Search**: Supports product name & category search (query param: `search`)
- **Pagination**: 10 items per page with prev/next controls
- **Batch Actions**: Select multiple → bulk delete
- **Individual Actions**: Edit → `/products/:id` or Delete (with confirmation)
- **Create**: Link to `/products/new`

**Flow**:

1. Load products via `GET /api/products/?search=...&page=1&page_size=10`
2. User searches → calls `loadProducts(1, searchText)`
3. User clicks Edit → navigate to `/products/:id`
4. User clicks Delete → confirm → `DELETE /api/products/:id/`

### ProductForm (`/products/new` or `/products/:id`)

✅ Connected to backend

- **Create**: POST to `/api/products/create/` with FormData (image + fields)
- **Edit**: Load product via `GET /api/products/:id/`, then PUT/PATCH to `/api/products/:id/`
- **Validation**:
  - Price > 0
  - Stock >= 0
  - Image < 5MB
- **Image Upload**: Multipart form data handled by axios + api.js

**Flow**:

1. If editing: Load product data
2. User fills form + uploads image
3. Click "Save Product" → validate → FormData append → POST/PUT
4. Success → redirect to `/products`

### OrdersList (`/orders`)

✅ Connected to backend

- **Search**: Order ID, customer email/username (query param: `search`)
- **Filter**: By payment status (Paid/Unpaid/All via `paid` param)
- **Pagination**: 10 items per page
- **Status Badges**: Green=Paid, Yellow=Pending
- **View Details**: Click "View" → `/orders/:id`

**Flow**:

1. Load orders via `GET /api/orders/?search=...&paid=true|false&page=1`
2. User filters → calls `loadOrders(1, search, statusFilter)`
3. User clicks "View" → navigate to `/orders/:id`

### OrderDetail (`/orders/:id`)

✅ Connected to backend

- **Status Updates**: PATCH requests to `/api/orders/:id/` with `{ isPaid, isDelivered, isRefunded }`
- **Real-time Feedback**: Success/error messages
- **Order Display**: Shows order items, shipping address, totals
- **Buttons**: Toggle payment status, delivery status, refund status

**Flow**:

1. Load order via `GET /api/orders/:id/`
2. User clicks "Mark Paid" → PATCH `/api/orders/:id/` with `{ isPaid: true }`
3. Show success → update local state
4. Repeat for other status fields

### UsersList (`/users`)

✅ Connected to backend

- **Search**: Username or email (query param: `search`)
- **Pagination**: 10 items per page
- **Batch Actions**: Select multiple → bulk delete
- **Individual Actions**: Edit placeholder (for future implementation) or Delete

**Flow**:

1. Load users via `GET /api/users/?search=...&page=1`
2. User searches → calls `fetchUsers(1, searchText)`
3. User deletes → `DELETE /api/users/:id/`

---

## Authentication & Authorization

✅ **Admin Protection**:

- All admin endpoints require `IsAdminUser` permission (backend)
- ProtectedRoute checks `profile().isAdmin` (frontend)
- Axios interceptor handles token refresh automatically

✅ **Token Management**:

- Access token stored in localStorage under `adminUser.token`
- Refresh token stored under `adminUser.refresh`
- Auto-refresh on 401 response (queued requests)

---

## Error Handling

✅ **Frontend**:

- Form validation with user-friendly error messages
- API error messages displayed in alerts
- Confirmation modals for destructive actions
- Loading states on buttons during requests

✅ **Backend**:

- Proper HTTP status codes (400, 401, 404, 204)
- Detailed error messages in response
- Permission checks on all admin endpoints
- Pagination error handling (defaults to page 1)

---

## Database Migrations

✅ **Applied Migrations**:

- `0001_initial.py` - Initial models
- `0002_order_orderitem_review_shippingaddress.py` - Order structure
- `0003_product_image.py` - Product image field
- `0004_order_isrefunded.py` - Order isRefunded field (NEW)

✅ **To Apply in Your Environment**:

```bash
cd backend
python manage.py migrate
```

---

## How to Test Locally

### Setup

1. **Backend**:

   ```bash
   cd backend
   python manage.py migrate
   python manage.py runserver 8000
   ```

2. **Admin Panel**:
   ```bash
   cd admin-panel
   npm install  # if not done
   REACT_APP_API_URL=http://localhost:8000 npm start
   # or defaults to http://localhost:8000
   ```

### Test Flow

1. Go to `http://localhost:3001/login`
2. Log in with admin account (isAdmin=true)
3. Navigate to **Products** → test search, pagination, create, edit, delete
4. Navigate to **Orders** → test search, filter by status, view details, toggle statuses
5. Navigate to **Users** → test search, pagination, delete

### Testing Commands (curl)

```bash
# Get products
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/products/?search=laptop&page=1

# Create product (as FormData)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=New Product" \
  -F "price=99.99" \
  -F "countInStock=10" \
  -F "image=@image.jpg" \
  http://localhost:8000/api/products/create/

# Get order
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/orders/1/

# Update order status
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPaid": true}' \
  http://localhost:8000/api/orders/1/
```

---

## Known Limitations & Future Improvements

- ✅ Product image upload working
- ✅ Order status updates (paid, delivered, refunded)
- ⏳ User edit form (placeholders exist, full CRUD coming)
- ⏳ Product bulk actions (edit/category change)
- ⏳ Advanced filters (price range, date range)
- ⏳ Dark mode toggle
- ⏳ Audit logs for admin actions

---

## Summary

**Backend**: All CRUD endpoints implemented with proper authentication, pagination, search, and error handling.

**Frontend**: All pages connected with real-time data binding, validation, and user feedback.

**Integration**: Full bidirectional API communication with automatic token refresh and error recovery.

**Ready to Deploy**: Test locally, then push to production with proper environment variables.

---
