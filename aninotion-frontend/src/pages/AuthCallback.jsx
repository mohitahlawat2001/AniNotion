import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setStatus('error');
          setError(getErrorMessage(errorParam));
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!token) {
          setStatus('error');
          setError('No authentication token received');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Store token
        localStorage.setItem('authToken', token);

        // Fetch user data with the token
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData.user));

        // Update auth context if available
        if (setUser && setIsAuthenticated) {
          setUser(userData.user);
          setIsAuthenticated(true);
        }

        setStatus('success');

        // Check if there was a pending action
        const pendingAction = sessionStorage.getItem('googleAuthSuccess');
        if (pendingAction) {
          sessionStorage.removeItem('googleAuthSuccess');
        }

        // Redirect to home after short delay
        setTimeout(() => navigate('/'), 1500);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setError(error.message || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUser, setIsAuthenticated]);

  const getErrorMessage = (errorCode) => {
    const messages = {
      'oauth_failed': 'Google authentication failed. Please try again.',
      'account_disabled': 'Your account has been disabled. Please contact support.',
      'authentication_failed': 'Authentication failed. Please try again.',
      'no_email': 'Could not retrieve email from Google account.'
    };
    return messages[errorCode] || 'An error occurred during authentication.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h2>
            <p className="text-gray-600">Please wait while we complete your sign-in.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="h-12 w-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">You've been successfully authenticated.</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting you to the home page...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="h-12 w-12 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
