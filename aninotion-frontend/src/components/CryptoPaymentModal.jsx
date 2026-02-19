import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Crown, 
  Gift, 
  Copy, 
  Check, 
  ExternalLink,
  Wallet,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { paymentsAPI } from '../services/api';

/**
 * CryptoPaymentModal Component
 * 
 * Modal for processing crypto payments for premium upgrades and donations
 * Supports multiple blockchain networks (Ethereum, Polygon, BSC, etc.)
 */
const CryptoPaymentModal = ({ isOpen, onClose, type = 'upgrade' }) => {
  const [step, setStep] = useState(1); // 1: Select plan, 2: Select network & token, 3: Pay, 4: Verify
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [selectedToken, setSelectedToken] = useState('USDC'); // Default to USDC
  const [config, setConfig] = useState(null);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [donationAmount, setDonationAmount] = useState('5');
  const [donationMessage, setDonationMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); // 'wallet' or 'manual'
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [sendingTx, setSendingTx] = useState(false);

  // Fetch config and prices
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [configData, pricesData] = await Promise.all([
        paymentsAPI.getConfig(),
        paymentsAPI.getPrices()
      ]);
      setConfig(configData);
      setPrices(pricesData);
    } catch (err) {
      setError('Failed to load payment information. Please try again.');
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setStep(1);
      setTxHash('');
      setVerificationResult(null);
      setSelectedToken('USDC'); // Reset to USDC
      setPaymentMethod(null);
      setWalletConnected(false);
      setWalletAddress('');
    }
  }, [isOpen, fetchData]);

  // Connect MetaMask wallet
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      setPaymentMethod('wallet');
      
      // Switch to the correct network if needed
      const chainIds = {
        ethereum: '0x1',
        polygon: '0x89',
        bsc: '0x38',
        arbitrum: '0xa4b1',
        base: '0x2105'
      };
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIds[selectedNetwork] }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          setError('Please add this network to MetaMask first.');
        }
      }
    } catch (err) {
      setError('Failed to connect MetaMask: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send transaction via MetaMask
  const sendWalletTransaction = async () => {
    if (!walletConnected || !window.ethereum) {
      setError('Wallet not connected');
      return;
    }

    setSendingTx(true);
    setError('');

    try {
      const amount = getCurrentAmount();
      const toAddress = config?.wallets?.[selectedNetwork]?.address;
      
      let txParams;
      
      if (selectedToken === 'USDC') {
        // ERC-20 transfer for USDC
        const usdcAddress = config?.wallets?.[selectedNetwork]?.usdcAddress;
        const amountInSmallestUnit = (parseFloat(amount.crypto) * Math.pow(10, config?.wallets?.[selectedNetwork]?.usdcDecimals || 6)).toString(16);
        
        // ERC-20 transfer function signature
        const transferData = '0xa9059cbb' + 
          toAddress.slice(2).padStart(64, '0') + 
          amountInSmallestUnit.padStart(64, '0');
        
        txParams = {
          from: walletAddress,
          to: usdcAddress,
          data: transferData,
          value: '0x0'
        };
      } else {
        // Native token transfer
        const amountInWei = (parseFloat(amount.crypto) * 1e18).toString(16);
        txParams = {
          from: walletAddress,
          to: toAddress,
          value: '0x' + amountInWei
        };
      }

      const transactionHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setTxHash(transactionHash);
      
      // Auto-verify after sending
      setTimeout(() => {
        handleVerifyPayment();
      }, 2000);
      
    } catch (err) {
      setError('Transaction failed: ' + (err.message || 'User rejected transaction'));
    } finally {
      setSendingTx(false);
    }
  };

  const handleCopyAddress = async () => {
    const address = config?.wallets?.[selectedNetwork]?.address;
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyPayment = async () => {
    if (!txHash.trim()) {
      setError('Please enter the transaction hash');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const result = await paymentsAPI.verify({
        transactionHash: txHash.trim(),
        network: selectedNetwork,
        type: type,
        plan: type === 'upgrade' ? selectedPlan : null,
        amount: type === 'donation' ? donationAmount : null,
        message: type === 'donation' ? donationMessage : null,
        token: selectedToken
      });

      setVerificationResult(result);
      
      if (result.success) {
        setStep(4);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your transaction hash.');
    } finally {
      setVerifying(false);
    }
  };

  const getNetworkIcon = (network) => {
    const icons = {
      ethereum: '⟠',
      polygon: '⬡',
      bsc: '◆',
      arbitrum: '🔵',
      base: '🔷'
    };
    return icons[network] || '●';
  };

  const getCurrentAmount = () => {
    if (!prices?.cryptoPricing || !selectedPlan) return null;
    const planPricing = prices.cryptoPricing[selectedPlan];
    
    // Use USDC if selected, otherwise use native token
    const symbol = selectedToken === 'USDC' ? 'USDC' : (config?.wallets?.[selectedNetwork]?.symbol || 'ETH');
    
    return {
      crypto: planPricing?.[symbol] || '0',
      usd: planPricing?.usd || 0,
      symbol
    };
  };

  if (!isOpen) return null;

  const amount = getCurrentAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b ${type === 'upgrade' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-white">
              {type === 'upgrade' ? <Crown size={24} /> : <Gift size={24} />}
              <h2 className="text-xl font-bold">
                {type === 'upgrade' ? 'Upgrade to Premium' : 'Support AniNotion'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="mt-3 text-gray-500">Loading payment options...</p>
            </div>
          ) : error && !verificationResult ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 text-amber-600 hover:text-amber-700"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          ) : step === 1 ? (
            // Step 1: Select Plan (for upgrade) or Amount (for donation)
            <div className="space-y-4">
              {type === 'upgrade' ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Choose Your Plan</h3>
                  <div className="space-y-3">
                    {['monthly', 'yearly', 'lifetime'].map((plan) => {
                      const planData = config?.pricing?.premium?.[plan];
                      const cryptoPrice = prices?.cryptoPricing?.[plan];
                      return (
                        <button
                          key={plan}
                          onClick={() => setSelectedPlan(plan)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPlan === plan
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900 capitalize">{plan}</h4>
                              <p className="text-sm text-gray-500">
                                {plan === 'lifetime' ? 'One-time payment' : `Billed ${plan}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${planData?.usdAmount || '0'}
                              </p>
                              <p className="text-xs text-gray-500">
                                ~{cryptoPrice?.ETH || '0'} ETH
                              </p>
                            </div>
                          </div>
                          {plan === 'yearly' && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Save 33%
                            </span>
                          )}
                          {plan === 'lifetime' && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              Best Value
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Support Amount</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['5', '10', '25'].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          donationAmount === amt
                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Custom amount"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0"
                      min="1"
                    />
                  </div>
                  <textarea
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    placeholder="Add a message (optional)"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 resize-none"
                    rows={2}
                    maxLength={200}
                  />
                </>
              )}
              
              <button
                onClick={() => setStep(2)}
                className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 ${
                  type === 'upgrade'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                }`}
              >
                <span>Continue</span>
                <ChevronRight size={18} />
              </button>
            </div>
          ) : step === 2 ? (
            // Step 2: Select Network & Token
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
              
              {/* Token Selection - USDC Recommended */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose Token</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setSelectedToken('USDC')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedToken === 'USDC'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">USDC</span>
                      {selectedToken === 'USDC' && <Check className="text-green-500" size={20} />}
                    </div>
                    <p className="text-xs text-gray-500">Stablecoin (Recommended)</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      No price volatility
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedToken('Native')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedToken === 'Native'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Native Token</span>
                      {selectedToken === 'Native' && <Check className="text-amber-500" size={20} />}
                    </div>
                    <p className="text-xs text-gray-500">ETH, MATIC, BNB</p>
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">Choose your preferred blockchain network</p>
              
              <div className="space-y-2">
                {config?.supportedNetworks?.map((network) => {
                  const wallet = config.wallets[network];
                  const supportsUSDC = wallet.supportsUSDC;
                  const isDisabled = selectedToken === 'USDC' && !supportsUSDC;
                  
                  return (
                    <button
                      key={network}
                      onClick={() => !isDisabled && setSelectedNetwork(network)}
                      disabled={isDisabled}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                        isDisabled 
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : selectedNetwork === network
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getNetworkIcon(network)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{wallet?.name}</h4>
                          <p className="text-sm text-gray-500">
                            {selectedToken === 'USDC' ? 'Pay with USDC' : `Pay with ${wallet?.symbol}`}
                          </p>
                        </div>
                      </div>
                      {selectedNetwork === network && !isDisabled && (
                        <Check className="text-amber-500" size={20} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white ${
                    type === 'upgrade'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : step === 3 ? (
            // Step 3: Payment Method Selection & Payment Details
            <div className="space-y-4">
              {!paymentMethod ? (
                // Payment Method Selection
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Choose Payment Method</h3>
                  
                  <div className="space-y-3">
                    {/* Wallet Connect Option */}
                    <button
                      onClick={connectMetaMask}
                      className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Wallet className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center">
                            Connect Wallet
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">Recommended</span>
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            Connect MetaMask or compatible wallet to send payment directly
                          </p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            <li>✓ Instant transaction</li>
                            <li>✓ Auto-verification</li>
                            <li>✓ Secure & easy</li>
                          </ul>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-amber-500 transition-colors" size={20} />
                      </div>
                    </button>

                    {/* Manual Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('manual')}
                      className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Copy className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Manual Payment
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            Copy address, send from any wallet, then paste transaction hash
                          </p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            <li>✓ Use any wallet app</li>
                            <li>✓ Works with hardware wallets</li>
                            <li>✓ Full control</li>
                          </ul>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-amber-500 transition-colors" size={20} />
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-50"
                  >
                    Back
                  </button>
                </>
              ) : paymentMethod === 'wallet' ? (
                // Wallet Payment Flow
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Send Payment</h3>
                    <button
                      onClick={() => {
                        setPaymentMethod(null);
                        setWalletConnected(false);
                        setWalletAddress('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change Method
                    </button>
                  </div>

                  {/* Wallet Connected Status */}
                  {walletConnected && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-green-700">
                        Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                  )}
                  
                  {/* Amount Display */}
                  {type === 'upgrade' && amount && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 text-center border-2 border-amber-200">
                      <p className="text-sm text-gray-600 mb-1">You will send</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">
                        {amount.crypto} {amount.symbol}
                      </p>
                      <p className="text-sm text-gray-500">(≈ ${amount.usd} USD)</p>
                      <p className="text-xs text-gray-400 mt-2">
                        on {config?.wallets?.[selectedNetwork]?.name}
                      </p>
                    </div>
                  )}

                  {type === 'donation' && (
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-center border-2 border-pink-200">
                      <p className="text-sm text-gray-600 mb-1">Donation amount</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">${donationAmount}</p>
                      <p className="text-sm text-gray-500">
                        (≈ {(parseFloat(donationAmount) / (prices?.prices?.[config?.wallets?.[selectedNetwork]?.symbol] || 2000)).toFixed(6)} {config?.wallets?.[selectedNetwork]?.symbol})
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={18} />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {txHash && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Transaction Sent!</p>
                      <p className="text-xs text-blue-700 font-mono break-all">{txHash}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setPaymentMethod(null);
                        setWalletConnected(false);
                      }}
                      className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-50"
                      disabled={sendingTx}
                    >
                      Back
                    </button>
                    <button
                      onClick={sendWalletTransaction}
                      disabled={!walletConnected || sendingTx}
                      className={`flex-1 py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        type === 'upgrade'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                      }`}
                    >
                      {sendingTx ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Wallet size={18} />
                          <span>Send Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // Manual Payment Flow
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Send Payment</h3>
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change Method
                    </button>
                  </div>
              
              {/* Amount Display */}
              {type === 'upgrade' && amount && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">Amount to send</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {amount.crypto} {amount.symbol}
                  </p>
                  <p className="text-sm text-gray-500">(≈ ${amount.usd} USD)</p>
                </div>
              )}

              {type === 'donation' && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">Donation amount</p>
                  <p className="text-3xl font-bold text-gray-900">${donationAmount}</p>
                  <p className="text-sm text-gray-500">
                    (≈ {(parseFloat(donationAmount) / (prices?.prices?.[config?.wallets?.[selectedNetwork]?.symbol] || 2000)).toFixed(6)} {config?.wallets?.[selectedNetwork]?.symbol})
                  </p>
                </div>
              )}

              {/* Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedToken === 'USDC' 
                    ? `Send USDC (${config?.wallets?.[selectedNetwork]?.name}) to:` 
                    : `Send to this ${config?.wallets?.[selectedNetwork]?.name} address:`}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-100 rounded-lg p-3 font-mono text-sm break-all">
                    {config?.wallets?.[selectedNetwork]?.address}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy address"
                  >
                    {copied ? <Check className="text-green-500" size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                {selectedToken === 'USDC' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      ⚠️ <strong>Important:</strong> Make sure to send USDC tokens to this address, not native {config?.wallets?.[selectedNetwork]?.symbol}. 
                      USDC contract: <span className="font-mono text-xs">{config?.wallets?.[selectedNetwork]?.usdcAddress?.slice(0, 10)}...</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Transaction Hash Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After sending, paste your transaction hash:
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-0 font-mono text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Verification pending message */}
              {verificationResult?.pending && (
                <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <Loader2 className="animate-spin" size={18} />
                  <p className="text-sm">{verificationResult.message}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-50"
                  disabled={verifying}
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyPayment}
                  disabled={!txHash.trim() || verifying}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    type === 'upgrade'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                  }`}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Payment</span>
                  )}
                </button>
              </div>

              {/* View on Explorer */}
              {txHash && (
                <a
                  href={`${config?.wallets?.[selectedNetwork]?.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink size={14} />
                  <span>View on {config?.wallets?.[selectedNetwork]?.name} Explorer</span>
                </a>
              )}
            </>
          )}
            </div>
          ) : step === 4 ? (
            // Step 4: Success
            <div className="text-center py-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                type === 'upgrade' ? 'bg-amber-100' : 'bg-pink-100'
              }`}>
                <Check className={type === 'upgrade' ? 'text-amber-500' : 'text-pink-500'} size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {verificationResult?.message || 'Payment Successful!'}
              </h3>
              <p className="text-gray-500 mb-6">
                {type === 'upgrade' 
                  ? 'Welcome to AniNotion Premium! Enjoy your exclusive features.'
                  : 'Thank you for supporting AniNotion! ❤️'
                }
              </p>
              
              {verificationResult?.payment?.explorerUrl && (
                <a
                  href={verificationResult.payment.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
                >
                  <ExternalLink size={14} />
                  <span>View Transaction</span>
                </a>
              )}

              <button
                onClick={() => {
                  onClose();
                  window.location.reload(); // Refresh to update user role
                }}
                className={`w-full py-3 rounded-lg font-semibold text-white ${
                  type === 'upgrade'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500'
                }`}
              >
                {type === 'upgrade' ? 'Start Exploring Premium' : 'Close'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <Wallet size={12} />
                <span>Secure crypto payment</span>
              </span>
              <span>•</span>
              <span>No credit card needed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoPaymentModal;
