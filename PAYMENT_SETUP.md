# Payment Gateway Setup Guide

This e-commerce platform supports multiple payment methods for flexibility and user convenience. This guide explains how to configure and use each payment gateway.

## Supported Payment Methods

1. **PayPal** - Secure, widely-trusted payment service
2. **Stripe** - Modern card payment processing
3. **Bank Transfer** - Direct bank-to-bank payment
4. **Cash on Delivery (COD)** - Pay when order arrives

---

## PayPal Integration

### Prerequisites

- PayPal Business Account (https://www.paypal.com/business)
- PayPal Sandbox Account for testing (https://developer.paypal.com)

### Setup Steps

#### 1. Create PayPal App

1. Go to https://developer.paypal.com/dashboard
2. Log in or create a Developer Account
3. Create a new App in the Sandbox
4. Get your **Client ID** and **Secret**

#### 2. Environment Configuration

Add to your `.env` or `.env.local`:

```bash
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret
```

#### 3. Frontend Configuration

The PayPal button component is located at: `frontend/src/components/PayPalButton.js`

Ensure the PayPal SDK script is loaded in your HTML:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID"></script>
```

#### 4. Testing

- Use Sandbox accounts for testing
- When order total > $0, PayPal button appears on checkout screen
- Click "Place Order" → Stripe/PayPal selection → PayPal button
- Complete PayPal login flow to test payment

---

## Stripe Integration

### Prerequisites

- Stripe Account (https://stripe.com)
- Stripe API Keys from Dashboard

### Setup Steps

#### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Log in or create account
3. Navigate to Developers → API Keys
4. Copy **Publishable Key** and **Secret Key**

#### 2. Environment Configuration

**Backend (.env):**

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

**Frontend (.env.local):**

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 3. Frontend Configuration

The Stripe payment component is located at: `frontend/src/components/StripePayment.js`

The component uses `@stripe/react-stripe-js` library. Install if not already:

```bash
npm install @stripe/react-stripe-js @stripe/js
```

#### 4. Payment Flow

- User selects "Stripe" on Payment Method screen
- Places order
- CardElement appears for secure card entry
- Card is tokenized via Stripe
- Payment processing happens server-side
- Order status updates to "paid"

#### 5. Testing

**Test Card Numbers:**

- Visa: `4242 4242 4242 4242`
- Visa (debit): `4000 0566 5566 5556`
- Mastercard: `5555 5555 5555 4444`
- Amex: `3782 822463 10005`

**Use any future expiry date and any CVC**

---

## Bank Transfer Integration

### Configuration

Located in: `frontend/src/components/TransferPayment.js`

### Payment Process

1. User selects "Transfer Now" payment method
2. Order is created in "pending" status
3. Bank details are displayed on order confirmation
4. User transfers amount to provided account
5. Admin confirms payment in admin panel
6. Order status updates to "paid"

### Backend Endpoint

```
PUT /api/orders/{orderId}/confirm-transfer/
PUT /api/orders/{orderId}/approve-transfer/  (admin only)
```

---

## Cash on Delivery (COD)

### Process

1. User selects "Cash on Delivery" payment method
2. Order is created in "pending" status
3. Order is processed and shipped
4. Payment collected upon delivery
5. Order marked as "paid" after delivery confirmation

### Backend Support

- No special configuration needed
- Mark order as `isPaid=True` after delivery
- Use admin panel to update payment status

---

## Payment Processing Flow

### Order Creation

```
User selects items → Adds shipping → Selects payment method → Places order
```

### Payment Processing by Method

#### PayPal Flow

```
Order Created (pending) → Shown PayPal Button → User logs in PayPal → Payment authorized → Order marked paid
```

#### Stripe Flow

```
Order Created (pending) → Shown Card Form → User enters card → Stripe creates payment method → Order marked paid
```

#### Transfer Flow

```
Order Created (pending) → Shown bank details → User transfers amount → User clicks "Confirm Transfer" → Admin approves → Order marked paid
```

#### COD Flow

```
Order Created (pending) → Order shipped → Payment collected on delivery → Order marked paid
```

---

## Invoice & Receipt

### PDF Receipt Download

- Users can download order invoices as PDF
- Located on Order Detail page
- Endpoint: `GET /api/orders/{orderId}/invoice/pdf/`
- Requires authentication

### Invoice Generation

- Backend: `backend/base/invoice_utils.py`
- HTML templates with professional styling
- Automatic PDF conversion using xhtml2pdf library

---

## Admin Panel Payment Management

Located in: `admin-panel/src/pages/OrdersList.js`

### Features

- View all orders with payment status
- Manually approve transfers
- Update order payment status
- View payment history
- Issue refunds

---

## Troubleshooting

### PayPal Not Working

1. Check Client ID in environment
2. Verify sandbox mode is enabled
3. Check browser console for SDK loading errors
4. Ensure order total > 0

### Stripe Not Showing

1. Verify `REACT_APP_STRIPE_PUBLISHABLE_KEY` is set
2. Check if @stripe/react-stripe-js package is installed
3. Verify CardElement is rendering (check browser DevTools)
4. Test with provided test card numbers

### Bank Transfer Confirmation Not Working

1. Verify admin is logged in
2. Check order transfer status
3. Review admin endpoints are properly secured

### General Issues

1. Check browser console for errors
2. Check Django server logs for backend errors
3. Verify all environment variables are set
4. Ensure payment methods are enabled in settings.py

---

## Security Considerations

1. **Never commit API keys** - Use environment variables
2. **HTTPS Only** - All payment pages must use HTTPS in production
3. **PCI Compliance** - Use tokenization, never store raw card data
4. **Token Refresh** - JWT tokens refresh automatically
5. **Order Verification** - Backend verifies user owns order before payment update

---

## Support URLs

- **Stripe Documentation**: https://stripe.com/docs
- **PayPal Documentation**: https://developer.paypal.com/docs
- **Django REST Framework**: https://www.django-rest-framework.org/
- **React Stripe**: https://stripe.com/docs/stripe-js/react

---

## Configuration Checklist

- [ ] Stripe API keys obtained and set in environment
- [ ] PayPal Client ID configured (optional)
- [ ] Bank transfer details configured
- [ ] Frontend STRIPE_PUBLISHABLE_KEY set
- [ ] xhtml2pdf installed for PDF generation
- [ ] All payment components imported correctly
- [ ] Payment endpoints tested
- [ ] Test transactions completed for each method
- [ ] Admin panel tested for payment management
- [ ] Invoice PDF download working
