# Crypto Payment Integration

This document describes the cryptocurrency payment integration for AniNotion premium features and donations.

## Overview

AniNotion supports cryptocurrency payments for:
- **Premium Upgrades**: Unlock hidden content and get the 'paid' role
- **Donations**: Support the platform development

## Supported Networks

| Network | Symbol | Chain ID |
|---------|--------|----------|
| Ethereum | ETH | 1 |
| Polygon | MATIC | 137 |
| BNB Smart Chain | BNB | 56 |
| Arbitrum One | ETH | 42161 |
| Base | ETH | 8453 |

## Pricing

### Premium Plans
- **Monthly**: $4.99 (30 days access)
- **Yearly**: $39.99 (365 days access, 33% discount)
- **Lifetime**: $99.99 (permanent access)

### Donations
- Minimum: $1.00 USD equivalent
- No maximum limit

## Setup

### Environment Variables

Add these to your `aninotion-backend/.env` file:

```env
# Crypto Wallet Addresses (use your own addresses)
ETH_WALLET_ADDRESS=0xYourEthereumWalletAddress
POLYGON_WALLET_ADDRESS=0xYourPolygonWalletAddress
BSC_WALLET_ADDRESS=0xYourBSCWalletAddress
ARB_WALLET_ADDRESS=0xYourArbitrumWalletAddress
BASE_WALLET_ADDRESS=0xYourBaseWalletAddress
```

### Getting Wallet Addresses

1. **MetaMask**: Install MetaMask browser extension
2. **Create/Import Wallet**: Set up your wallet
3. **Copy Address**: Click on your account to copy the address
4. **Same Address**: You can use the same address for all EVM networks (Ethereum, Polygon, BSC, Arbitrum, Base)

## How It Works

### User Flow

1. User clicks "Upgrade to Premium" or "Donate"
2. Selects plan (for upgrades) or enters amount (for donations)
3. Chooses blockchain network
4. Copies the wallet address and sends payment from their wallet
5. Pastes transaction hash for verification
6. System verifies transaction on blockchain
7. User role is upgraded to 'paid' (for upgrades)

### Technical Flow

```
User -> Frontend -> Backend -> Blockchain RPC
                      |
                      v
                   MongoDB (Payment record)
                      |
                      v
                   User Model (role update)
```

## API Endpoints

### Public Endpoints

- `GET /api/payments/config` - Get wallet addresses and pricing
- `GET /api/payments/prices` - Get current crypto prices in USD

### Authenticated Endpoints

- `POST /api/payments/create` - Create payment request
- `POST /api/payments/verify` - Verify transaction hash
- `GET /api/payments/history` - Get user's payment history
- `GET /api/payments/status` - Check premium status

### Admin Endpoints

- `GET /api/payments/admin/pending` - Get pending payments
- `POST /api/payments/admin/verify/:paymentId` - Manual verification

## Database Schema

### Payment Model

```javascript
{
  user: ObjectId,
  transactionHash: String,
  fromAddress: String,
  toAddress: String,
  network: String,
  type: 'upgrade' | 'donation',
  amount: String,
  tokenSymbol: String,
  status: 'pending' | 'confirming' | 'confirmed' | 'failed',
  confirmations: Number,
  blockNumber: Number,
  tier: 'monthly' | 'yearly' | 'lifetime' | null,
  expiresAt: Date,
  // ... timestamps
}
```

### User Model Updates

```javascript
{
  // Existing fields...
  walletAddress: String,
  premiumExpiresAt: Date
}
```

## Security Considerations

1. **Transaction Verification**: All transactions are verified directly on the blockchain
2. **Duplicate Prevention**: Each transaction hash can only be used once
3. **Admin Override**: Admins can manually verify payments if automatic verification fails
4. **No Private Keys**: Backend never handles private keys - only verifies public transactions

## Frontend Components

### UpgradeSidebar
- Shows premium benefits
- Appears for authenticated non-premium users
- Opens CryptoPaymentModal

### CryptoPaymentModal
- Multi-step payment flow
- Network selection
- Live crypto price display
- Transaction verification

## Troubleshooting

### Transaction Not Verifying

1. Wait for more block confirmations (usually 1-3 minutes)
2. Ensure you sent to the correct wallet address
3. Verify the transaction succeeded on the block explorer
4. Contact admin for manual verification

### Price Fetch Failed

The system uses CoinGecko API for live prices. If it fails, cached/fallback prices are used.

## Future Improvements

- [ ] Add more networks (Solana, etc.)
- [ ] Support ERC-20 tokens (USDT, USDC)
- [ ] Integrate with WalletConnect
- [ ] Add subscription auto-renewal via smart contracts
- [ ] Add NFT-based premium access
