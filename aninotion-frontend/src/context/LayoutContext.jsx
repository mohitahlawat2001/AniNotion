import React, { createContext, useState, useEffect } from 'react';

export const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [layout, setLayout] = useState('grid');

  // Load layout preference from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('layout-preference');
    if (savedLayout && (savedLayout === 'grid' || savedLayout === 'list')) {
      setLayout(savedLayout);
    }
  }, []);

  // Save layout preference to localStorage whenever it changes
  const updateLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('layout-preference', newLayout);
  };

  const toggleLayout = () => {
    const newLayout = layout === 'grid' ? 'list' : 'grid';
    updateLayout(newLayout);
  };

  const value = {
    layout,
    setLayout: updateLayout,
    toggleLayout,
    isGrid: layout === 'grid',
    isList: layout === 'list'
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
