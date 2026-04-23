# Crypto Payment Setup - Quick Start

## 🎯 USDC Payments (Recommended)

**Why USDC?** It's a stablecoin pegged 1:1 with USD - no price volatility!

Users can now pay with **USDC** or native tokens (ETH, MATIC, BNB, etc.)

## Issue: Getting 404 on Payment Endpoints

If you're seeing 404 errors for `/api/payments/config` and `/api/payments/prices`, follow these steps:

## 1. Add Wallet Addresses to .env

Open `/workspaces/AniNotion/aninotion-backend/.env` and add these lines:

```env
# Crypto Payment Wallets (REPLACE WITH YOUR OWN WALLET ADDRESS)
ETH_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
POLYGON_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
BSC_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
ARB_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
BASE_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
```

**⚠️ IMPORTANT**: Replace the example address with your own wallet address!

## 2. Get Your Wallet Address

### Option A: Using MetaMask (Recommended)
1. Install [MetaMask](https://metamask.io) browser extension
2. Create a new wallet or import existing one
3. Click on your account name to copy the address
4. Paste it in all the wallet fields above

### Option B: Use Any EVM Wallet
- Trust Wallet
- Coinbase Wallet
- Rainbow Wallet
- Any wallet that supports Ethereum addresses

**Note**: You can use the SAME address for all networks (ETH, Polygon, BSC, etc.) since they all use the same EVM address format.

## 3. Restart Backend Server

The backend needs to be restarted to load the new routes and environment variables:

### In Terminal:
```bash
cd /workspaces/AniNotion/aninotion-backend
npm start
```

Or if using nodemon:
```bash
cd /workspaces/AniNotion/aninotion-backend
npm run dev
```

## 4. Test the Endpoints

Open in browser or curl:
- http://localhost:5000/api/payments/config
- http://localhost:5000/api/payments/prices

You should see JSON responses with wallet addresses and pricing.

## 5. Test Frontend

1. Login to your app
2. Look for the "Go Premium" sidebar (right side on desktop)
3. Click "Upgrade to Premium" or "Support with Donation"
4. Modal should open with network selection

## Security Notes

1. **Private Keys**: NEVER share your private keys or seed phrase
2. **Wallet Separation**: Consider using a dedicated wallet for receiving payments, separate from your personal funds
3. **Monitoring**: Regularly check your wallet for incoming transactions
4. **Verification**: All transactions are automatically verified on the blockchain

## Troubleshooting

### Still getting 404?
- Make sure you restarted the backend server
- Check `/workspaces/AniNotion/aninotion-backend/routes/payments.js` exists
- Check backend logs for any errors

### Can't see "Go Premium" sidebar?
- Make sure you're logged in
- Make sure you're not already a premium user (role !== 'paid')
- Check browser console for errors

### Prices not loading?
- The app uses CoinGecko API for live prices
- If API fails, it will show cached/fallback prices
- Check backend logs for "Error fetching crypto prices"

## What Happens When User Pays?

### With USDC (Recommended):
1. User selects plan and "USDC" as payment token
2. User chooses network (Ethereum, Polygon, etc.)
3. User copies your wallet address
4. **User sends USDC tokens** from their wallet (using MetaMask, Trust Wallet, etc.)
5. User pastes transaction hash
6. Backend verifies USDC transfer on blockchain
7. If valid, user role updates to 'paid'
8. User gains access to hidden content

### With Native Tokens:
Same process, but users send ETH/MATIC/BNB instead of USDC (price may fluctuate)

## Supported Networks & USDC

## Supported Networks & USDC

| Network | USDC Supported | Native Token | USDC Address |
|---------|----------------|--------------|--------------|
| Ethereum | ✅ Yes | ETH | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| Polygon | ✅ Yes | MATIC | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |
| BSC | ✅ Yes | BNB | 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d |
| Arbitrum | ✅ Yes | ETH | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| Base | ✅ Yes | ETH | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |

**Note:** Users send USDC to YOUR wallet address, not to the USDC contract address!

## Manual Verification (Admin)

If automatic verification fails, admins can manually verify payments:

**Endpoint**: `POST /api/payments/admin/verify/:paymentId`

Get pending payments: `GET /api/payments/admin/pending`

---

For more details, see: `/workspaces/AniNotion/aninotion-backend/docs/CRYPTO_PAYMENTS.md`
