import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

const AuthButton = ({ children, onClick, className = '', requireAuth = true, ...props }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
    } else {
      onClick?.();
    }
  };

  const handleLoginSuccess = () => {
    // After successful login, execute the original action
    onClick?.();
  };

  // Filter out our custom props from the DOM props
  const { requireAuth: _, ...buttonProps } = { requireAuth, ...props };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  if (!requireAuth || isAuthenticated) {
    return (
      <>
        <button onClick={handleClick} className={className} {...buttonProps}>
          {children}
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          onSwitchToSignup={switchToSignup}
        />
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSuccess={handleLoginSuccess}
          onSwitchToLogin={switchToLogin}
        />
      </>
    );
  }

  return (
    <>
      <button onClick={handleClick} className={className} {...buttonProps}>
        {children}
      </button>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToSignup={switchToSignup}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
};

export default AuthButton;
