import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// ── Serialize/Deserialize User ────────────────────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, { id: user.id, provider: user.provider });
});

passport.deserializeUser((obj, done) => {
  // In production, fetch user from database
  done(null, obj);
});

// Only load real OAuth strategies if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  // ── GitHub Strategy ──────────────────────────────────────────────────────────
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3001/auth/github/callback',
        scope: ['user:email'],
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          emails: profile.emails,
          photos: profile.photos,
          provider: 'github',
        };
        return done(null, user);
      }
    )
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // ── Google Strategy ──────────────────────────────────────────────────────────
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3001/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          emails: profile.emails,
          photos: profile.photos,
          provider: 'google',
        };
        return done(null, user);
      }
    )
  );
}

export default passport;
