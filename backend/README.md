# Backend Setup

Copy `.env.example` to `.env` and fill in your database credentials, API keys, JWT secret, Schwab OAuth credentials, (optionally) a TOKEN_EXPIRATION value, and (optionally) an INVESTMENT_CACHE_TTL value.

```bash
# Rename example file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

> **Note:** On startup, the following tables will be automatically created if they do not already exist:
> - `users`
> - `user_investments`
> - `user_btc_wallets`
> - `user_wallets`
> - `bitcoin_treasuries`
> - `user_investment_summaries`
> - `bitcoin_treasuries`

> **CORS Configuration:**
> - In development (`NODE_ENV !== 'production'`), all origins are allowed.
> - In production (`NODE_ENV === 'production'`), only the domains listed in the `allowedOrigins` array in `sgaInvest.js` are permitted. Update that list to match your front-end hostnames.


# Email Notifications

To receive an email notification on each new user registration, configure SMTP settings in your `.env`:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM="App Name" <noreply@yourdomain.com>
ADMIN_EMAIL=info@visionkraftconsulting.com
```

The backend will automatically send a notice to `ADMIN_EMAIL` on each successful registration.

# Admin API

Provides endpoints for Super Admins to view and manage registered users.

| Method | Endpoint             | Description                            |
| ------ | -------------------- | -------------------------------------- |
| GET    | /api/admin/users     | List all registered users              |
| PUT    | /api/admin/users/:id | Update user fields (body: { email?, name?, phone?, country?, role? }) |
| DELETE | /api/admin/users/:id | Delete a user                          |

> **Note:** Changing a user's email uses database `ON UPDATE CASCADE` to propagate updates to related records. However, if both the old and new emails have existing entries in those tables, the update will fail with HTTP 400. Merge or remove conflicting child data before attempting to change the email.

All requests require a valid JWT (`Authorization: Bearer <token>`) and the user must have the `Super Admin` role.

# Subscription Management (Stripe)

Configure Stripe settings in your `.env`:
```dotenv
# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_stripe_price_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# Frontend URL for redirect after checkout (e.g. http://localhost:4005)
FRONTEND_URL=http://localhost:4005
```

The backend provides endpoints to manage subscriptions:

| Method | Endpoint                                               | Description                                |
| ------ | ------------------------------------------------------ | ------------------------------------------ |
| POST   | /api/subscription/create-checkout-session             | Create a Stripe Checkout session for trial |
| GET    | /api/subscription/status                              | Get current user's subscription status     |
| POST   | /api/subscription/cancel                              | Cancel at period end                       |
| POST   | /api/subscription/webhook                             | Stripe webhook for subscription events     |

> **Super Admin Access:** Users with the `Super Admin` role are automatically treated as subscribed (status `active`) and have full access to all features without a Stripe subscription.

## Automatic Trial on Registration

The `/api/auth/register` endpoint now automatically creates a Stripe Checkout session to collect payment details and start a 7-day free trial. It returns `{ sessionId, sessionUrl }`. After the user completes the payment information on the Stripe-hosted page, they will be redirected to the login page.

Admin API for subscription management (Admins and Super Admins):

| Method | Endpoint                                                 | Description                           |
| ------ | -------------------------------------------------------- | ------------------------------------- |
| GET    | /api/admin/subscriptions                                 | List all user subscriptions           |
| POST   | /api/admin/subscriptions/:email/cancel                   | Cancel subscription for a user        |
| POST   | /api/admin/subscriptions/:email/resume                   | Resume subscription for a user        |
| POST   | /api/admin/subscriptions/:email/prompt                  | Send subscription prompt email to a user |