import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopButton = ({ 
  showAfter = 200, // Reduced from 300px to 200px for earlier appearance
  scrollBehavior = 'smooth',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: scrollBehavior,
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 
        bg-black/20 backdrop-blur-sm 
        hover:bg-black/30 
        text-white 
        rounded-full 
        shadow-lg hover:shadow-xl
        border border-white/30 hover:border-white/40
        transition-all duration-300 ease-in-out
        touch-target
        flex items-center justify-center
        group
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
        ${className}
      `}
      aria-label="Scroll to top"
    >
      <ChevronUp 
        size={20} 
        className="transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" 
      />
    </button>
  );
};

export default ScrollToTopButton;