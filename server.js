const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static assets from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to send files regardless of casing
const sendPublicFile = (res, targetFileName) => {
  const publicDir = path.join(__dirname, 'public');
  
  try {
    const files = fs.readdirSync(publicDir);
    const matchedFile = files.find(f => f.toLowerCase() === targetFileName.toLowerCase());
    
    if (matchedFile) {
      return res.sendFile(path.join(publicDir, matchedFile));
    }
  } catch (err) {
    console.error('Error reading public directory:', err);
  }
  
  return res.status(404).send(`${targetFileName} not found in public folder.`);
};

// Root route - Redirect to Admin Login
app.get('/', (req, res) => {
  sendPublicFile(res, 'Admin-login.html');
});

// Explicit route for Admin Login page
app.get(['/admin-login', '/admin-login.html', '/Admin-login.html'], (req, res) => {
  sendPublicFile(res, 'Admin-login.html');
});

// Explicit route for Dashboard page
app.get(['/dashboard', '/dashboard.html', '/Dashboard.html'], (req, res) => {
  sendPublicFile(res, 'dashboard.html');
});

// Authentication endpoint for form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // If request comes from standard HTML form submit, redirect directly
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      return res.redirect('/dashboard');
    }
    // If request comes from fetch/AJAX, return JSON status
    return res.status(200).json({ success: true, redirect: '/dashboard' });
  }

  return res.status(401).send('Invalid Credentials. <a href="/admin-login">Try again</a>');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));