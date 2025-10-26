import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { 
  LogIn, 
  UserPlus, 
  PenSquare, 
  Bookmark, 
  TrendingUp, 
  Sparkles,
  Eye,
  Heart,
  X
} from 'lucide-react';

/**
 * LoginPromptSidebar Component
 *
 * Sidebar that promotes sign-up/login benefits
 * Only displays when user is NOT authenticated
 * Shows features users get after signing in
 */
const LoginPromptSidebar = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Don't render if user is authenticated or if dismissed
  if (isAuthenticated || isDismissed) {
    return null;
  }

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const handleModalSuccess = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
    // No need to do anything else, useAuth will update isAuthenticated
  };

  const features = [
    {
      icon: PenSquare,
      title: 'Create Posts',
      description: 'Share your anime reviews and insights'
    },
    {
      icon: Eye,
      title: 'View Your Posts',
      description: 'Access and manage all your content'
    },
    {
      icon: Bookmark,
      title: 'Bookmark Posts',
      description: 'Save your favorite posts for later'
    },
    {
      icon: TrendingUp,
      title: 'See Trending',
      description: 'Discover what\'s popular right now'
    },
    {
      icon: Sparkles,
      title: 'Get Recommendations',
      description: 'Personalized content just for you'
    },
    {
      icon: Heart,
      title: 'Like & Engage',
      description: 'Interact with the community'
    }
  ];

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden shadow-sm relative ${className}`}>
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="p-4 border-b border-blue-200 bg-white/50">
        <div className="flex items-center space-x-2">
          <UserPlus className="text-blue-600" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Join AniNotion</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Unlock premium features
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon className="text-blue-600" size={16} />
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

      {/* CTA Buttons */}
      <div className="p-4 border-t border-blue-200 bg-white/50 space-y-2">
        <button
          onClick={() => setShowSignupModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <UserPlus size={18} />
          <span>Sign Up Free</span>
        </button>
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors border border-gray-300 flex items-center justify-center space-x-2"
        >
          <LogIn size={18} />
          <span>Log In</span>
        </button>
      </div>

      {/* Footer Note */}
      <div className="px-4 pb-4">
        <p className="text-xs text-center text-gray-500">
          Join our community of anime enthusiasts
        </p>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleModalSuccess}
        onSwitchToSignup={switchToSignup}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleModalSuccess}
        onSwitchToLogin={switchToLogin}
      />
    </div>
  );
};

export default LoginPromptSidebar;
