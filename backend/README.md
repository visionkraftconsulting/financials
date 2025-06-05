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
| PUT    | /api/admin/users/:id | Update a user's role (body: { role })  |
| DELETE | /api/admin/users/:id | Delete a user                          |

All requests require a valid JWT (`Authorization: Bearer <token>`) and the user must have the `Super Admin` role.