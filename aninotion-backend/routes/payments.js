const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const logger = require('../config/logger');

// Wallet configuration - set these in your .env file
const WALLET_CONFIG = {
  ethereum: {
    address: process.env.ETH_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
    usdcDecimals: 6
  },
  polygon: {
    address: process.env.POLYGON_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    symbol: 'MATIC',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC on Polygon
    usdcDecimals: 6
  },
  bsc: {
    address: process.env.BSC_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    symbol: 'BNB',
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
    usdcDecimals: 18
  },
  arbitrum: {
    address: process.env.ARB_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    symbol: 'ETH',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
    usdcDecimals: 6
  },
  base: {
    address: process.env.BASE_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    symbol: 'ETH',
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    usdcDecimals: 6
  }
};

// Pricing in USD (will be converted to crypto at current rates)
const PRICING = {
  premium: {
    monthly: {
      usdAmount: 4.99,
      description: 'AniNotion Premium - Monthly',
      expiryDays: 30
    },
    yearly: {
      usdAmount: 39.99,
      description: 'AniNotion Premium - Yearly',
      expiryDays: 365
    },
    lifetime: {
      usdAmount: 99.99,
      description: 'AniNotion Premium - Lifetime',
      expiryDays: null
    }
  },
  donation: {
    minUsdAmount: 1.00
  }
};

/**
 * GET /api/payments/config
 * Get wallet addresses and pricing configuration
 */
router.get('/config', (req, res) => {
  const wallets = {};
  for (const [network, config] of Object.entries(WALLET_CONFIG)) {
    wallets[network] = {
      address: config.address,
      symbol: config.symbol,
      name: config.name,
      chainId: config.chainId,
      explorerUrl: config.explorerUrl,
      usdcAddress: config.usdcAddress,
      supportsUSDC: !!config.usdcAddress
    };
  }

  res.json({
    wallets,
    pricing: PRICING,
    supportedNetworks: Object.keys(WALLET_CONFIG),
    supportedTokens: ['USDC', 'Native'] // USDC is recommended for stable prices
  });
});

/**
 * GET /api/payments/prices
 * Get current crypto prices in USD
 */
router.get('/prices', async (req, res) => {
  try {
    // Fetch prices from CoinGecko (free API)
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'ethereum,matic-network,binancecoin',
          vs_currencies: 'usd'
        },
        timeout: 5000
      }
    );

    const prices = {
      ETH: response.data.ethereum?.usd || 2000,
      MATIC: response.data['matic-network']?.usd || 0.80,
      BNB: response.data.binancecoin?.usd || 300
    };

    // Calculate crypto amounts for each plan
    const cryptoPricing = {};
    for (const [plan, details] of Object.entries(PRICING.premium)) {
      cryptoPricing[plan] = {
        usd: details.usdAmount,
        USDC: details.usdAmount.toFixed(2), // USDC is 1:1 with USD
        ETH: (details.usdAmount / prices.ETH).toFixed(6),
        MATIC: (details.usdAmount / prices.MATIC).toFixed(4),
        BNB: (details.usdAmount / prices.BNB).toFixed(6)
      };
    }

    res.json({
      prices,
      cryptoPricing,
      recommended: 'USDC', // Recommend USDC for stable pricing
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching crypto prices', { error: error.message });
    // Return fallback prices
    res.json({
      prices: { ETH: 2000, MATIC: 0.80, BNB: 300 },
      cryptoPricing: {
        monthly: { usd: 4.99, USDC: '4.99', ETH: '0.002495', MATIC: '6.2375', BNB: '0.016633' },
        yearly: { usd: 39.99, USDC: '39.99', ETH: '0.019995', MATIC: '49.9875', BNB: '0.133300' },
        lifetime: { usd: 99.99, USDC: '99.99', ETH: '0.049995', MATIC: '124.9875', BNB: '0.333300' }
      },
      recommended: 'USDC',
      lastUpdated: new Date().toISOString(),
      cached: true
    });
  }
});

/**
 * POST /api/payments/create
 * Create a pending payment record
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { type, plan, network, amount, message } = req.body;
    const userId = req.user._id;

    logger.info('Creating crypto payment', { userId, type, plan, network });

    // Validate network
    if (!WALLET_CONFIG[network]) {
      return res.status(400).json({
        error: 'Invalid network',
        message: 'Please select a supported blockchain network'
      });
    }

    let tier = null;
    let expiryDays = null;
    let description = '';

    if (type === 'upgrade') {
      if (!plan || !PRICING.premium[plan]) {
        return res.status(400).json({
          error: 'Invalid plan',
          message: 'Please select a valid premium plan'
        });
      }

      // Check if user already has active premium
      const hasActivePremium = await Payment.hasActivePremium(userId);
      if (hasActivePremium) {
        return res.status(400).json({
          error: 'Already premium',
          message: 'You already have an active premium subscription'
        });
      }

      tier = plan;
      expiryDays = PRICING.premium[plan].expiryDays;
      description = PRICING.premium[plan].description;

    } else if (type === 'donation') {
      description = message ? `Donation: ${message.substring(0, 50)}` : 'Donation to AniNotion';
    } else {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Payment type must be "upgrade" or "donation"'
      });
    }

    const walletConfig = WALLET_CONFIG[network];

    res.json({
      paymentDetails: {
        toAddress: walletConfig.address,
        network: network,
        networkName: walletConfig.name,
        chainId: walletConfig.chainId,
        symbol: walletConfig.symbol,
        explorerUrl: walletConfig.explorerUrl,
        type,
        tier,
        description
      },
      pricing: type === 'upgrade' ? PRICING.premium[plan] : null,
      message: `Please send the payment to the wallet address and submit the transaction hash for verification.`
    });

  } catch (error) {
    logger.error('Error creating payment', { error: error.message });
    res.status(500).json({
      error: 'Payment failed',
      message: 'Failed to initialize payment. Please try again.'
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify a crypto transaction and update payment status
 */
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { transactionHash, network, type, plan, amount, message, token } = req.body;
    const userId = req.user._id;

    if (!transactionHash || !network) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Transaction hash and network are required'
      });
    }

    // Check if transaction already exists
    const existingPayment = await Payment.findByTxHash(transactionHash);
    if (existingPayment) {
      return res.status(400).json({
        error: 'Duplicate transaction',
        message: 'This transaction has already been submitted'
      });
    }

    const walletConfig = WALLET_CONFIG[network];
    if (!walletConfig) {
      return res.status(400).json({
        error: 'Invalid network',
        message: 'Unsupported blockchain network'
      });
    }

    let tier = null;
    let expiryDays = null;
    let description = '';
    const useUSDC = token === 'USDC';

    if (type === 'upgrade') {
      if (!plan || !PRICING.premium[plan]) {
        return res.status(400).json({
          error: 'Invalid plan',
          message: 'Please select a valid premium plan'
        });
      }
      tier = plan;
      expiryDays = PRICING.premium[plan].expiryDays;
      description = PRICING.premium[plan].description;
    } else {
      description = message ? `Donation: ${message.substring(0, 50)}` : 'Donation to AniNotion';
    }

    // Create payment record (pending verification)
    const payment = new Payment({
      user: userId,
      transactionHash: transactionHash.toLowerCase(),
      fromAddress: req.body.fromAddress?.toLowerCase() || 'unknown',
      toAddress: walletConfig.address.toLowerCase(),
      network: network,
      type: type,
      amount: amount || '0',
      tokenSymbol: useUSDC ? 'USDC' : walletConfig.symbol,
      tokenAddress: useUSDC ? walletConfig.usdcAddress : null,
      status: 'pending',
      description: description,
      donorMessage: type === 'donation' ? message : null,
      tier: tier,
      expiresAt: expiryDays 
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
        : null
    });

    await payment.save();

    // Try to verify transaction on blockchain
    const verified = await verifyTransaction(
      transactionHash, 
      network, 
      walletConfig.address,
      useUSDC,
      walletConfig.usdcAddress,
      walletConfig.usdcDecimals
    );
    
    if (verified.success) {
      payment.status = 'confirmed';
      payment.confirmations = verified.confirmations;
      payment.blockNumber = verified.blockNumber;
      payment.amount = verified.amount || amount;
      payment.fromAddress = verified.from?.toLowerCase() || payment.fromAddress;
      await payment.save();

      // If this is an upgrade, update user role to 'paid'
      if (type === 'upgrade') {
        await User.findByIdAndUpdate(userId, { 
          role: 'paid',
          premiumExpiresAt: payment.expiresAt,
          walletAddress: verified.from?.toLowerCase()
        });

        logger.info('User upgraded to paid role via crypto', { 
          userId,
          tier: payment.tier,
          txHash: transactionHash,
          token: payment.tokenSymbol
        });
      }

      res.json({
        success: true,
        message: type === 'upgrade' 
          ? 'Payment verified! Welcome to AniNotion Premium!' 
          : 'Thank you for your donation!',
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          tokenSymbol: payment.tokenSymbol,
          explorerUrl: `${walletConfig.explorerUrl}/tx/${transactionHash}`
        }
      });
    } else {
      // Transaction pending or needs manual verification
      payment.status = 'confirming';
      payment.errorMessage = verified.error;
      await payment.save();

      res.json({
        success: false,
        pending: true,
        message: 'Transaction submitted. It will be verified shortly.',
        payment: {
          id: payment._id,
          status: payment.status,
          explorerUrl: `${walletConfig.explorerUrl}/tx/${transactionHash}`
        }
      });
    }

  } catch (error) {
    logger.error('Error verifying payment', { error: error.message });
    res.status(500).json({
      error: 'Verification failed',
      message: 'Failed to verify transaction. Please try again or contact support.'
    });
  }
});

/**
 * Verify transaction on blockchain
 */
async function verifyTransaction(txHash, network, expectedTo, isUSDC = false, usdcAddress = null, usdcDecimals = 6) {
  try {
    const config = WALLET_CONFIG[network];
    
    // Use JSON-RPC to get transaction receipt
    const response = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 1
    }, { timeout: 10000 });

    const receipt = response.data.result;
    
    if (!receipt) {
      return { success: false, error: 'Transaction not found or pending' };
    }

    if (receipt.status !== '0x1') {
      return { success: false, error: 'Transaction failed on blockchain' };
    }

    // Get transaction details
    const txResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1
    }, { timeout: 10000 });

    const tx = txResponse.data.result;
    
    let amount = '0';
    let fromAddress = tx.from;

    if (isUSDC && usdcAddress) {
      // Verify USDC token transfer
      // Look for Transfer event in logs: Transfer(address indexed from, address indexed to, uint256 value)
      // Event signature: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
      
      const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      // Find the USDC transfer log
      const transferLog = receipt.logs.find(log => 
        log.address.toLowerCase() === usdcAddress.toLowerCase() &&
        log.topics[0] === transferEventSignature
      );

      if (!transferLog) {
        return { success: false, error: 'No USDC transfer found in transaction' };
      }

      // Decode the transfer: topics[1] = from, topics[2] = to, data = amount
      const toAddressFromLog = '0x' + transferLog.topics[2].slice(26); // Remove padding
      
      if (toAddressFromLog.toLowerCase() !== expectedTo.toLowerCase()) {
        return { success: false, error: 'USDC was not sent to the correct address' };
      }

      // Decode amount from data field
      const amountHex = transferLog.data;
      const amountBigInt = BigInt(amountHex);
      const amountDecimal = Number(amountBigInt) / Math.pow(10, usdcDecimals);
      amount = amountDecimal.toFixed(usdcDecimals);

      // Get sender from topics[1]
      fromAddress = '0x' + transferLog.topics[1].slice(26);

    } else {
      // Verify native token (ETH, MATIC, BNB) transfer
      if (tx.to?.toLowerCase() !== expectedTo.toLowerCase()) {
        return { success: false, error: 'Transaction recipient does not match' };
      }

      // Convert value from hex to decimal (in ETH/native token)
      const valueWei = BigInt(tx.value);
      const valueEth = Number(valueWei) / 1e18;
      amount = valueEth.toFixed(8);
    }

    // Get current block for confirmation count
    const blockResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    }, { timeout: 5000 });

    const currentBlock = parseInt(blockResponse.data.result, 16);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;

    return {
      success: true,
      confirmations,
      blockNumber: txBlock,
      from: fromAddress,
      amount: amount
    };

  } catch (error) {
    logger.error('Blockchain verification error', { error: error.message, network, txHash });
    return { success: false, error: 'Could not verify transaction on blockchain' };
  }
}

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const payments = await Payment.getUserPayments(req.user._id, {
      limit: parseInt(req.query.limit) || 20
    });

    res.json({
      payments: payments.map(p => ({
        id: p._id,
        type: p.type,
        amount: p.amount,
        tokenSymbol: p.tokenSymbol,
        network: p.network,
        status: p.status,
        tier: p.tier,
        description: p.description,
        transactionHash: p.transactionHash,
        explorerUrl: WALLET_CONFIG[p.network] 
          ? `${WALLET_CONFIG[p.network].explorerUrl}/tx/${p.transactionHash}`
          : null,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching payment history', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch payment history'
    });
  }
});

/**
 * GET /api/payments/status
 * Check user's premium status
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const hasActivePremium = await Payment.hasActivePremium(req.user._id);
    
    let premiumDetails = null;
    if (hasActivePremium) {
      const activePayment = await Payment.findOne({
        user: req.user._id,
        type: 'upgrade',
        status: 'confirmed',
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).sort({ createdAt: -1 });

      premiumDetails = {
        tier: activePayment.tier,
        expiresAt: activePayment.expiresAt,
        isLifetime: !activePayment.expiresAt,
        network: activePayment.network
      };
    }

    res.json({
      isPremium: hasActivePremium,
      role: req.user.role,
      premiumDetails
    });
  } catch (error) {
    logger.error('Error checking premium status', { error: error.message });
    res.status(500).json({
      error: 'Failed to check premium status'
    });
  }
});

/**
 * POST /api/payments/admin/verify
 * Manual verification by admin
 */
router.post('/admin/verify/:paymentId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'confirmed';
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user._id;
    await payment.save();

    // If upgrade, update user role
    if (payment.type === 'upgrade') {
      await User.findByIdAndUpdate(payment.user, { 
        role: 'paid',
        premiumExpiresAt: payment.expiresAt
      });
    }

    logger.info('Payment manually verified', { 
      paymentId: payment._id, 
      verifiedBy: req.user._id 
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });

  } catch (error) {
    logger.error('Error in manual verification', { error: error.message });
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/payments/admin/pending
 * Get all pending payments for admin review
 */
router.get('/admin/pending', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const payments = await Payment.find({ 
      status: { $in: ['pending', 'confirming'] } 
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ payments });
  } catch (error) {
    logger.error('Error fetching pending payments', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

module.exports = router;
