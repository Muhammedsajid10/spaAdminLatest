// Reset script to clear mock data mode and localStorage
// Run this in browser console or include it in your app to force real data mode

// Clear all relevant localStorage items
localStorage.removeItem('useMockData');
localStorage.removeItem('token');
localStorage.removeItem('user');

console.log('🔄 Mock data mode reset!');
console.log('🧹 LocalStorage cleared');
console.log('🔄 Page will reload to fetch real data...');

// Reload the page to start fresh
window.location.reload();
