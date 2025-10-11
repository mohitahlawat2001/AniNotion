import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children, activeCategory, onCategoryChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          //className="lg:hidden fixed inset-0 bg-opacity-10 backdrop-blur-sm z-30"
          className="lg:hidden fixed inset-0 bg-black/10 backdrop-blur-sm z-30" //miminal
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 
        fixed lg:static 
        z-40 lg:z-auto
        transition-transform duration-300 ease-in-out
      `}
      >
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          onMobileItemClick={closeMobileMenu}
          isMobile={true}
        />
      </div>

      {/* Main content with footer */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-0">
        <main className="flex-1 p-4 lg:p-6 overflow-auto pt-6 lg:pt-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
