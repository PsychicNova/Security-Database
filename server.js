const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.redirect('/Admin-login.html');
});

// Dashboard route fallback
app.get(['/dashboard', '/dashboard.html', '/Dashboard.html'], (req, res) => {
  const publicDir = path.join(__dirname, 'public');
  const files = fs.readdirSync(publicDir);
  const target = files.find(f => f.toLowerCase() === 'dashboard.html');

  if (target) {
    res.sendFile(path.join(publicDir, target));
  } else {
    res.status(404).send('Dashboard file not found in public directory.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));