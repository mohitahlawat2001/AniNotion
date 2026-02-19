import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CryptoPaymentModal from './CryptoPaymentModal';
import { SHOW_PREMIUM_SIDEBAR } from '../config/featureFlags';
import { 
  Crown, 
  Sparkles, 
  Eye,
  Star,
  Zap,
  Gift,
  Lock,
  X
} from 'lucide-react';

/**
 * UpgradeSidebar Component
 *
 * Sidebar that promotes premium upgrade benefits
 * Only displays when user IS authenticated but NOT premium
 * Shows features users get after upgrading to paid role
 */
const UpgradeSidebar = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('upgrade');

  // Feature flag: hide the premium sidebar entirely when disabled
  if (!SHOW_PREMIUM_SIDEBAR) {
    return null;
  }

  // Don't render if user is not authenticated, is premium, or is dismissed
  if (!isAuthenticated || isDismissed) {
    return null;
  }

  // Don't show if user already has paid role or admin/editor roles
  if (user?.role === 'paid' || user?.role === 'admin' || user?.role === 'editor') {
    return null;
  }

  const handleUpgradeClick = () => {
    setPaymentType('upgrade');
    setShowPaymentModal(true);
  };

  const handleDonateClick = () => {
    setPaymentType('donation');
    setShowPaymentModal(true);
  };

  const features = [
    {
      icon: Eye,
      title: 'Hidden Content',
      description: 'Access exclusive hidden posts & categories'
    },
    {
      icon: Star,
      title: 'Premium Badge',
      description: 'Stand out with a special profile badge'
    },
    {
      icon: Zap,
      title: 'Early Access',
      description: 'Get new features before everyone else'
    },
    {
      icon: Lock,
      title: 'Paid Role',
      description: 'Unlock all premium-only content'
    },
    {
      icon: Sparkles,
      title: 'Ad-Free Experience',
      description: 'Browse without any interruptions'
    }
  ];

  return (
    <>
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden shadow-sm relative ${className}`}>
        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="p-4 border-b border-amber-200 bg-white/50">
          <div className="flex items-center space-x-2">
            <Crown className="text-amber-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Go Premium</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Unlock exclusive content with crypto
          </p>
        </div>

        {/* Features List */}
        <div className="p-4 space-y-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/60 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Icon className="text-amber-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Crypto Badge */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 bg-white/60 rounded-lg py-2">
            <span>🔗</span>
            <span>Pay with ETH, MATIC, BNB & more</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-4 border-t border-amber-200 bg-white/50 space-y-2">
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Crown size={18} />
            <span>Upgrade to Premium</span>
          </button>
          <button
            onClick={handleDonateClick}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors border border-gray-300 flex items-center justify-center space-x-2"
          >
            <Gift size={18} />
            <span>Support with Donation</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-4 pb-4">
          <p className="text-xs text-center text-gray-500">
            Support AniNotion's development ❤️
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <CryptoPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type={paymentType}
      />
    </>
  );
};

export default UpgradeSidebar;
