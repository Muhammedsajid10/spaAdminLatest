// Browser script to set the correct token and force real data mode
// Paste this into the browser console

// Clear existing localStorage
localStorage.clear();

// Set the fresh token
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NjhiODQ0ZTE5MDc2MmNhNjkzZDk0MiIsImlhdCI6MTc1Mjc3NTYyNiwiZXhwIjoxNzYwNTUxNjI2fQ.Zb4OKKaPzNNYV7NYm5sZ0egSe2PFadHSxTT8U18sF_4');

// Set user data
localStorage.setItem('user', JSON.stringify({
  "_id": "6868b844e190762ca693d942",
  "firstName": "System",
  "lastName": "Administrator",
  "email": "admin@spa.com",
  "phone": "+1234567890",
  "role": "admin",
  "fullName": "System Administrator"
}));

// Remove mock data flag if it exists
localStorage.removeItem('useMockData');

console.log('✅ Fresh token and user data set!');
console.log('🔄 Reloading page to fetch real data...');

// Reload the page
window.location.reload();
