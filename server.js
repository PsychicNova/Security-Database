const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy (uses Render environment variables)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/admin-login.html' }),
  (req, res) => {
    res.redirect('/Dashboard.html');
  }
);

// Persistent JSON File Storage for Users
const usersFilePath = path.join(__dirname, 'users.json');

function getUsers() {
  if (!fs.existsSync(usersFilePath)) {
    // Default fallback admin account
    return [{ username: 'admin', password: 'admin123' }];
  }
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Register Route (Saves new user permanently)
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const users = getUsers();
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Username already exists.' });
  }

  users.push({ username, password });
  saveUsers(users);

  return res.status(200).json({ 
    success: true, 
    redirect: '/Dashboard.html', 
    message: 'Account created successfully!' 
  });
});

// Login Route (Verifies credentials against saved users)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    return res.status(200).json({ 
      success: true, 
      redirect: '/Dashboard.html' 
    });
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password.' 
    });
  }
});

// Case-insensitive static file routing fallback
app.get('/*', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});