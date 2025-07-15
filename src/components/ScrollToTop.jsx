import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL (like #section), skip the auto-scroll
    if (!hash) {
      // Force scroll to top with a small delay to ensure it works
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' // Use 'instant' instead of 'smooth' for immediate scroll
        });
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;