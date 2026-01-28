/**
 * Production Session Configuration
 * Optimized session store for production deployment
 */

const session = require('express-session');

// Production session configuration
function getSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'none' : 'lax' // CORS-friendly in production
    },
    name: 'jobportal.sid', // Custom session name
    rolling: true, // Reset expiration on activity
    unset: 'destroy' // Remove session from store when unset
  };

  // In production, use a more suitable session store
  if (isProduction) {
    // For production, we'll use a simple in-memory store with cleanup
    // In a real production environment, you'd use Redis or a database store
    const MemoryStore = require('memorystore')(session);
    
    sessionConfig.store = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
      max: 1000, // Maximum number of sessions
      dispose: (key, sess) => {
        console.log('🗑️ Session disposed:', key);
      }
    });
    
    console.log('✅ Using optimized MemoryStore for production sessions');
  } else {
    console.log('✅ Using default MemoryStore for development');
  }

  return sessionConfig;
}

module.exports = { getSessionConfig };
