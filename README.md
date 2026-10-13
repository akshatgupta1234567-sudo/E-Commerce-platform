# Iron & Steel Commerce Platform

A full-stack commerce MVP for trade and workshop supplies. The repository contains an Express/MongoDB API and a React + Vite storefront with account, cart, Razorpay checkout, order history, and admin screens.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- Cloudinary credentials for product image uploads
- Razorpay test credentials to try checkout

## Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, email-provider credentials, and the Razorpay test key pair in `backend/.env`. Email verification is required before sign-in. For Gmail, create a Google App Password and use it as `EMAIL_PASS`; do not use your regular account password. Alternatively configure `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` for your provider. Email credentials are required for new account registration and verification; they are optional for order confirmation messages.

Product image uploads work locally and save to `backend/uploads/products`. For deployment, configure the Cloudinary values in `.env.example` so uploads persist outside an individual server instance.

New customers receive a six-digit email verification code, valid for 10 minutes. They must verify it before a session is created. Incorrect codes are limited to five attempts, and resending is throttled. If registration reports an email-delivery error, check the SMTP/Gmail App Password settings before trying again.

Start the API:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`; check MongoDB connectivity at `GET /api/health`.

## Configure the frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Set `VITE_RAZORPAY_KEY_ID` to the same public test key as `RAZORPAY_KEY_ID` in the backend. Keep the Razorpay secret only in the backend environment. `VITE_API_URL` defaults to `http://localhost:5000/api`.

Run the storefront:

```powershell
npm run dev
```

Vite serves the site at `http://localhost:5173`.

## Load demo inventory

After the backend has a working MongoDB connection, run this once to insert eight example steel products:

```powershell
cd backend
npm run seed
```

The seed only inserts missing demo products; it does not overwrite an existing product with the same name. Update or remove these sample catalog items in the admin panel to match your real products and prices.

## Admin setup

Register a normal account through the storefront, then connect `mongosh` to the same database configured in `backend/.env` and update the account email:

```javascript
db.users.updateOne(
  { email: "your-admin-email@example.com" },
  { $set: { role: "admin" } }
)
```

Sign out and sign back in after changing the role so the account receives an admin token. Admins can add products and manage order statuses at `/admin`.

## Production build

```powershell
cd frontend
npm run build
npm run preview
```

Deploy the Vite `frontend/dist` directory to a static host, enable SPA history fallback to `index.html`, and set `VITE_API_URL` to the deployed API URL at build time. Configure the backend `CLIENT_URL` with the deployed frontend origin(s), comma-separated if needed. Use production database, email, and payment credentials before accepting live orders. Set Razorpay to automatically capture successful payments; the API verifies captured payments before making an order.

## Current scope

- Product browsing, category filters, search, and product detail.
- Persistent browser cart, account registration/login, and order history.
- Email verification during registration, with expiring codes and resend controls.
- Admin product creation/removal and order-status management.
- Product image uploads to Cloudinary when configured, or local disk during development.
- Authenticated Razorpay order creation; order totals and product prices are recalculated on the server and payment details are checked before saving orders.

Before a live launch, configure Razorpay webhooks and refunds, add recovery for the rare case where payment succeeds but order saving fails, expand backend/API tests beyond payment-signature validation, and review deployment secrets and rate limiting.
