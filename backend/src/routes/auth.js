import express from 'express';
import passport from 'passport';
import { getMockUser, mockAuthMiddleware } from '../services/mockAuth.js';

const router = express.Router();

// Check if real OAuth credentials are available
const USE_MOCK_AUTH = !process.env.GITHUB_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID;

if (USE_MOCK_AUTH) {
  console.log('⚠️  Using MOCK authentication (no real OAuth credentials detected)');
  console.log('   To use real GitHub/Google OAuth, add credentials to .env file');
  
  // ── Mock GitHub OAuth ──────────────────────────────────────────────────────
  router.get('/github', (req, res) => {
    req.user = getMockUser('github');
    res.redirect(`http://localhost:5173/dashboard?user=${encodeURIComponent(req.user.displayName)}&provider=github&mock=true`);
  });

  router.get('/github/callback', (req, res) => {
    res.redirect('http://localhost:3001/auth/github');
  });

  // ── Mock Google OAuth ──────────────────────────────────────────────────────
  router.get('/google', (req, res) => {
    req.user = getMockUser('google');
    res.redirect(`http://localhost:5173/dashboard?user=${encodeURIComponent(req.user.displayName)}&provider=google&mock=true`);
  });

  router.get('/google/callback', (req, res) => {
    res.redirect('http://localhost:3001/auth/google');
  });

} else {
  // ── Real GitHub OAuth ──────────────────────────────────────────────────────
  router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

  router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth?error=github' }),
    (req, res) => {
      res.redirect(`http://localhost:5173/dashboard?user=${encodeURIComponent(req.user.displayName || req.user.username)}`);
    }
  );

  // ── Real Google OAuth ───────────────────────────────────────────────────────
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth?error=google' }),
    (req, res) => {
      res.redirect(`http://localhost:5173/dashboard?user=${encodeURIComponent(req.user.displayName || req.user.email)}`);
    }
  );
}

// ── Logout ─────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

// ── Get Current User ───────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (USE_MOCK_AUTH) {
    // Return mock user data
    res.json({
      id: 'mock-user-123',
      name: 'Demo User',
      email: 'demo@greenops.local',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      provider: 'mock',
      isMock: true,
    });
  } else if (req.isAuthenticated?.() && req.user) {
    res.json({
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.emails?.[0]?.value || req.user.email,
      avatar: req.user.photos?.[0]?.value,
      provider: req.user.provider,
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
