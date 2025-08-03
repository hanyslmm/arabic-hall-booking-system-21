import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Enhanced touch gesture support for RTL layout
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isSwipeStart = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      // Detect swipe from right edge for RTL layout
      if (touch.clientX > window.innerWidth - 30) {
        isSwipeStart = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeStart) return;
      
      const touch = e.touches[0];
      const deltaX = startX - touch.clientX;
      const deltaY = Math.abs(touch.clientY - startY);
      
      // If horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
        if (deltaX < 0 && !sidebarOpen) {
          // Swipe right to left (open sidebar in RTL)
          setSidebarOpen(true);
          isSwipeStart = false;
        } else if (deltaX > 0 && sidebarOpen) {
          // Swipe left to right (close sidebar in RTL)
          setSidebarOpen(false);
          isSwipeStart = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isSwipeStart = false;
    };

    // Add keyboard support for accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  return {
    sidebarOpen,
    setSidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleSidebar: () => setSidebarOpen(prev => !prev),
  };
};