const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'security-database-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google OAuth Strategy Setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://security-database-kw44.onrender.com/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

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

// Explicit routes for dashboard page
app.get(['/dashboard', '/dashboard.html', '/Dashboard.html'], (req, res) => {
  sendPublicFile(res, 'Dashboard.html');
});

// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/admin-login.html' }),
  (req, res) => {
    res.redirect('/Dashboard.html');
  }
);

// Standard Authentication Endpoints
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

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  return res.status(200).json({ 
    success: true, 
    redirect: '/Dashboard.html', 
    message: 'Account created successfully!' 
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));