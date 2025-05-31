# Backend Setup

Copy `.env.example` to `.env` and fill in your database credentials, API keys, JWT secret, and (optionally) a TOKEN_EXPIRATION value.

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
> - `bitcoin_treasuries`

> **CORS Configuration:**
> - In development (`NODE_ENV !== 'production'`), all origins are allowed.
> - In production (`NODE_ENV === 'production'`), only the domains listed in the `allowedOrigins` array in `sgaInvest.js` are permitted. Update that list to match your front-end hostnames.