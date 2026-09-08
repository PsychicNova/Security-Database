const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from your existing 'public' folder (CSS, images, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for active room occupancy
const activeSessions = {};

// Admin Credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

// -------------------------------------------------------------
// 1. HARDWARE ENDPOINTS (Used by ESP12E)
// -------------------------------------------------------------

// ENTRY LOGIC
app.post('/api/logs/entry', (req, res) => {
  const { personId, position } = req.body;

  if (!personId) {
    return res.status(400).json({ error: "personId is required" });
  }

  const entryTime = Date.now();

  activeSessions[personId] = {
    entryTime: entryTime,
    position: position || "door_zone",
    alertSent: false
  };

  console.log(`[ENTRY] ${personId} entered at ${new Date(entryTime).toLocaleTimeString()}`);

  res.status(200).json({ status: "success", message: `Entry recorded for ${personId}` });
});

// EXIT LOGIC
app.post('/api/logs/exit', (req, res) => {
  const { personId } = req.body;

  if (activeSessions[personId]) {
    const durationMinutes = Math.floor((Date.now() - activeSessions[personId].entryTime) / 60000);
    console.log(`[EXIT] ${personId} left after ${durationMinutes} minutes.`);
    
    delete activeSessions[personId];
  } else {
    console.log(`[EXIT] ${personId} left.`);
  }

  res.status(200).json({ status: "success", message: `Exit recorded for ${personId}` });
});

// -------------------------------------------------------------
// 2. BACKGROUND WORKER (Checks for 30-Minute Overstays)
// -------------------------------------------------------------
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();

  for (const [personId, session] of Object.entries(activeSessions)) {
    const timeInRoom = now - session.entryTime;

    if (timeInRoom >= THIRTY_MINUTES_MS && !session.alertSent) {
      session.alertSent = true;
      console.log(`\n[ALERT] ${personId} HAS BEEN IN ROOM FOR OVER 30 MINUTES!\n`);
    }
  }
}, 10000); // Checks every 10 seconds

// -------------------------------------------------------------
// 3. ADMIN AUTH & DASHBOARD ENDPOINTS
// -------------------------------------------------------------

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({ success: true, redirectUrl: '/dashboard.html' });
  } else {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }
});

// Fetch Real-time Status for Admin Dashboard
app.get('/api/admin/status', (req, res) => {
  const now = Date.now();
  const sessionList = [];

  for (const [personId, session] of Object.entries(activeSessions)) {
    const durationMinutes = Math.floor((now - session.entryTime) / 60000);
    
    sessionList.push({
      personId: personId,
      position: session.position,
      durationMinutes: durationMinutes,
      alertTriggered: session.alertSent || durationMinutes >= 30
    });
  }

  res.json({ activeUsers: sessionList });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});