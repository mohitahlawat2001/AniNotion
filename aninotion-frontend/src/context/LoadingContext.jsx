import React, { createContext, useState, useCallback } from 'react';

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading, type = 'spinner', message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading ? { isLoading, type, message } : undefined
    }));
  }, []);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || { isLoading: false, type: 'spinner', message: '' };
  }, [loadingStates]);

  const setGlobalLoadingState = useCallback((isLoading, type = 'spinner', message = '') => {
    setGlobalLoading(isLoading);
    if (isLoading) {
      setLoading('global', true, type, message);
    } else {
      clearLoading('global');
    }
  }, [setLoading, clearLoading]);

  const value = {
    globalLoading,
    loadingStates,
    setLoading,
    clearLoading,
    isLoading,
    getLoadingState,
    setGlobalLoadingState,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};
