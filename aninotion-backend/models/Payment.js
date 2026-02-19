const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks all cryptocurrency payment transactions for premium upgrades and donations
 */
const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Blockchain transaction hash
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  // Sender's wallet address
  fromAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  // Receiver's wallet address (our wallet)
  toAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  // Blockchain network (ethereum, polygon, bsc, etc.)
  network: {
    type: String,
    enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'solana'],
    default: 'ethereum'
  },
  // Payment type: 'upgrade' for paid role, 'donation' for tips
  type: {
    type: String,
    enum: ['upgrade', 'donation'],
    required: true
  },
  // Amount in native token (ETH, MATIC, BNB, etc.)
  amount: {
    type: String, // Using string for precise decimal handling
    required: true
  },
  // Token symbol (ETH, MATIC, USDT, USDC, etc.)
  tokenSymbol: {
    type: String,
    default: 'ETH',
    uppercase: true
  },
  // Token contract address (null for native tokens)
  tokenAddress: {
    type: String,
    lowercase: true,
    default: null
  },
  // USD equivalent at time of transaction
  usdValue: {
    type: Number,
    default: 0
  },
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'confirming', 'confirmed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Number of block confirmations
  confirmations: {
    type: Number,
    default: 0
  },
  // Block number where transaction was included
  blockNumber: {
    type: Number
  },
  // Description/note for the payment
  description: {
    type: String,
    trim: true
  },
  // For donations: optional message from donor
  donorMessage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Subscription tier (if applicable)
  tier: {
    type: String,
    enum: ['basic', 'premium', 'supporter', null],
    default: null
  },
  // When the paid role expires (null for lifetime or donations)
  expiresAt: {
    type: Date,
    default: null
  },
  // Transaction metadata
  metadata: {
    type: Object,
    default: {}
  },
  // Error information if payment failed
  errorMessage: {
    type: String
  },
  // Verified by admin (for manual verification)
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ transactionHash: 1 });
paymentSchema.index({ fromAddress: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ network: 1 });
paymentSchema.index({ createdAt: -1 });

// Check if payment is for premium upgrade
paymentSchema.methods.isPremiumUpgrade = function() {
  return this.type === 'upgrade' && this.status === 'confirmed';
};

// Check if premium is still active
paymentSchema.methods.isPremiumActive = function() {
  if (!this.isPremiumUpgrade()) return false;
  if (!this.expiresAt) return true; // Lifetime
  return new Date() < this.expiresAt;
};

// Static method to get user's payment history
paymentSchema.statics.getUserPayments = function(userId, options = {}) {
  const query = this.find({ user: userId });
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to check if user has active premium
paymentSchema.statics.hasActivePremium = async function(userId) {
  const payment = await this.findOne({
    user: userId,
    type: 'upgrade',
    status: 'confirmed',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return !!payment;
};

// Static method to get total donations received
paymentSchema.statics.getTotalDonations = async function() {
  const result = await this.aggregate([
    { $match: { type: 'donation', status: 'confirmed' } },
    { $group: { _id: '$tokenSymbol', total: { $sum: { $toDouble: '$amount' } } } }
  ]);
  
  return result;
};

// Static method to find by transaction hash
paymentSchema.statics.findByTxHash = function(txHash) {
  return this.findOne({ transactionHash: txHash.toLowerCase() });
};

module.exports = mongoose.model('Payment', paymentSchema);
