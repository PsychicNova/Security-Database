const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  secret: 'radar-command-center-secret-key'
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: "https://security-database-kw44.onrender.com/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Return user profile directly without saving to disk
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- Google Auth Endpoints ---

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/admin-login.html' }),
  (req, res) => {
    // Successful login redirects straight to dashboard
    res.redirect('/Dashboard.html');
  }
);

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ success: false });
    req.session.destroy();
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

app.get('/api/check-auth', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }
  return res.json({ authenticated: false });
});

// --- Explicit Page Routes ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(['/admin-login', '/admin-login.html', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get(['/dashboard', '/Dashboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Dashboard.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Command Center running on port ${PORT}`);
});