import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

const AuthButton = ({ children, onClick, className = '', requireAuth = true, ...props }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
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
      />
    </>
  );
};

export default AuthButton;
