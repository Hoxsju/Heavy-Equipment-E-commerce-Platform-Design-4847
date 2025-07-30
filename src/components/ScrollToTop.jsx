import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL (like #section), skip the auto-scroll
    if (!hash) {
      // Multiple scroll attempts for maximum reliability
      const scrollToTop = () => {
        // Try multiple scroll methods
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Force scroll with instant behavior
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      };
      
      // Initial scroll
      scrollToTop();
      
      // Additional scroll attempts with delays
      setTimeout(scrollToTop, 0);
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 200);
    }
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;