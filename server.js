const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to serve files from public/ regardless of casing
const sendPublicFile = (res, targetFileName) => {
  const publicDir = path.join(__dirname, 'public');
  
  try {
    const files = fs.readdirSync(publicDir);
    const matchedFile = files.find(f => f.toLowerCase() === targetFileName.toLowerCase());
    
    if (matchedFile) {
      return res.sendFile(path.join(publicDir, matchedFile));
    }
    return res.status(404).send(`File "${targetFileName}" not found in public directory. Files present: [${files.join(', ')}]`);
  } catch (err) {
    console.error('Error reading public directory:', err);
    return res.status(500).send('Internal server error reading public directory.');
  }
};

// Root route - Serve admin login
app.get('/', (req, res) => {
  sendPublicFile(res, 'admin-login.html');
});

// Explicit routes for login page
app.get(['/admin-login', '/admin-login.html', '/Admin-login.html'], (req, res) => {
  sendPublicFile(res, 'admin-login.html');
});

// Explicit routes for dashboard page (handles any casing)
app.get(['/dashboard', '/dashboard.html', '/Dashboard.html'], (req, res) => {
  sendPublicFile(res, 'dashboard.html');
});

// Authentication endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // Standard HTML form submission redirect
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      return res.redirect('/dashboard');
    }
    // Fetch/AJAX JSON response
    return res.status(200).json({ success: true, redirect: '/dashboard', message: 'Login successful' });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));