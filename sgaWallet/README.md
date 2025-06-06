# SGA Wallet

This is a static multi-chain wallet generator page. It allows users to generate wallets for Ethereum (and other EVM-compatible chains) and Solana directly in the browser. Private keys and seed phrases are never sent to a server and are not stored; please save them securely.

## Usage

Serve these files (`index.html`, `script.js`, `styles.css`) from a web server. For example:

```bash
# using Python's simple HTTP server
python3 -m http.server --directory sgaWallet 8000
```

Then navigate to `http://localhost:8000` in your browser to use the wallet generator.