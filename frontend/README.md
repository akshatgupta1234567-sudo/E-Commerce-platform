# Iron & Steel Storefront

React + TypeScript storefront and admin interface powered by Vite.

Run from this directory:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend API and `VITE_RAZORPAY_KEY_ID` to the public Razorpay key. Never put the Razorpay secret in a `VITE_` variable. Account registration requires a configured SMTP/email provider on the backend so it can deliver verification codes.

Run `npm run build` to type-check and create the production bundle in `dist/`.
