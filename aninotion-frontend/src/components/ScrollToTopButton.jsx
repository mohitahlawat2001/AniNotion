import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTopButton = ({
  showAfter = 200,
  scrollBehavior = "smooth",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get scroll position from main element (which has overflow-auto)
      const mainElement = document.querySelector("main");
      const mainScrollY = mainElement ? mainElement.scrollTop : 0;

      // Also check window scroll as fallback
      const windowScrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // Use the maximum of both
      const scrollY = Math.max(mainScrollY, windowScrollY);

      setIsVisible(scrollY > showAfter);
    };

    // Check initial position
    handleScroll();

    // Listen to main element scroll (this is where the actual scrolling happens)
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Also listen to window scroll as fallback
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showAfter]);

  const scrollToTop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Scroll the main element to top (where the actual scrolling happens)
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: scrollBehavior,
      });
    }

    // Also scroll window as fallback
    if (window.scrollTo) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: scrollBehavior,
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 
        bg-white hover:bg-gray-50
        text-gray-700 hover:text-gray-900
        rounded-full 
        shadow-lg hover:shadow-xl
        border border-gray-200 hover:border-gray-300
        transition-all duration-300 ease-in-out
        touch-target
        flex items-center justify-center
        group
        transform hover:scale-110
        ${className}
      `}
      aria-label="Scroll to top"
      type="button"
    >
      <ChevronUp
        size={20}
        className="transition-transform duration-200 group-hover:-translate-y-0.5"
      />
    </button>
  );
};

export default ScrollToTopButton;