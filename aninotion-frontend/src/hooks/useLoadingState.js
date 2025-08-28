import { useState, useCallback } from 'react';

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingType, setLoadingType] = useState('spinner');
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((type = 'spinner', message = '') => {
    setIsLoading(true);
    setLoadingType(type);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingType('spinner');
    setLoadingMessage('');
  }, []);

  const updateLoadingType = useCallback((type) => {
    setLoadingType(type);
  }, []);

  const updateLoadingMessage = useCallback((message) => {
    setLoadingMessage(message);
  }, []);

  return {
    isLoading,
    loadingType,
    loadingMessage,
    startLoading,
    stopLoading,
    updateLoadingType,
    updateLoadingMessage,
    setIsLoading, // Keep for backward compatibility
  };
};
