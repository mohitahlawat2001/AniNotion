import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;