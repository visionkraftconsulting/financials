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
> - `bitcoin_treasuries`