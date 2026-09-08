const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to locate files case-insensitively
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

// Routes
app.get('/', (req, res) => {
  sendPublicFile(res, 'admin-login.html');
});

app.get(['/admin-login', '/admin-login.html', '/Admin-login.html'], (req, res) => {
  sendPublicFile(res, 'admin-login.html');
});

app.get(['/dashboard', '/dashboard.html', '/Dashboard.html'], (req, res) => {
  sendPublicFile(res, 'Dashboard.html');
});

// Authentication endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      return res.redirect('/Dashboard.html');
    }
    return res.status(200).json({ success: true, redirect: '/Dashboard.html', message: 'Login successful' });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));