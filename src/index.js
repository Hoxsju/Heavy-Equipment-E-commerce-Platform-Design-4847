// Add a global scroll restoration helper
window.scrollToTop = () => {
  // First try using standard scroll
  window.scrollTo(0, 0);
  
  // Then use scrollTo with options
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, 0);
  
  // Add another attempt with a longer delay
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
};

// Override history methods to force scroll to top
const originalPushState = history.pushState;
history.pushState = function() {
  originalPushState.apply(this, arguments);
  window.scrollToTop();
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  window.scrollToTop();
};

// Create a more reliable scroll function
window.forceScrollToTop = () => {
  // Try multiple scroll methods
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Add additional attempts with delays
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, 10);
  
  setTimeout(() => {
    window.scrollTo({top: 0, behavior: 'instant'});
  }, 50);
};