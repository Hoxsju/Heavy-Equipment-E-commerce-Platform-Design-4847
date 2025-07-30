import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PublicLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    // Simulate initial load completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    // Handle viewport height changes for mobile browsers
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    // Set initial viewport height
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // iOS Safari specific - handle when keyboard opens/closes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (isIOS && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Mobile-optimized loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-gray-50 overflow-x-hidden"
      style={{ minHeight: `${viewportHeight}px` }}
    >
      <Header />
      <main className="flex-1 w-full">
        <div className="w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;