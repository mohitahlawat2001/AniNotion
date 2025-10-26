import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationContext = createContext();

// Custom hook in separate export to avoid Fast Refresh warning
export function useNavigationStack() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationStack must be used within NavigationProvider');
  }
  return context;
}

export function NavigationProvider({ children }) {
  const [navigationStack, setNavigationStack] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    
    setNavigationStack((prevStack) => {
      // Don't add duplicate consecutive entries
      if (prevStack.length > 0 && prevStack[prevStack.length - 1] === currentPath) {
        return prevStack;
      }
      
      // Add current path to stack
      return [...prevStack, currentPath];
    });
  }, [location.pathname]);

  // Navigate back using our stack
  const navigateBack = useCallback(() => {
    setNavigationStack((prevStack) => {
      if (prevStack.length <= 1) {
        // No history, go to home
        navigate('/');
        return [];
      }

      // Remove current page
      const newStack = [...prevStack];
      newStack.pop();

      // Get previous page
      const previousPage = newStack[newStack.length - 1];

      // Navigate to previous page
      if (previousPage) {
        navigate(previousPage);
      } else {
        navigate('/');
      }

      return newStack;
    });
  }, [navigate]);

  // Clear stack (useful for logout or reset)
  const clearStack = useCallback(() => {
    setNavigationStack([]);
  }, []);

  // Get previous page without navigating
  const getPreviousPage = useCallback(() => {
    if (navigationStack.length > 1) {
      return navigationStack[navigationStack.length - 2];
    }
    return null;
  }, [navigationStack]);

  const value = {
    navigationStack,
    navigateBack,
    clearStack,
    getPreviousPage,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Export default to satisfy Fast Refresh
export default NavigationProvider;
