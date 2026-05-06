# OAuth Setup Guide

## Overview
GreenOps now has full OAuth integration for GitHub and Google login. Users can sign in with either provider or use email/password authentication.

---

## 🔑 Getting OAuth Credentials

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** GreenOps
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:3001/auth/github/callback`
4. Click "Register application"
5. You'll see **Client ID** and **Client Secret**
6. Copy these to `backend/.env`:
   ```
   GITHUB_CLIENT_ID=your_id_here
   GITHUB_CLIENT_SECRET=your_secret_here
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**
9. Add to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your_id_here
   GOOGLE_CLIENT_SECRET=your_secret_here
   ```

---

## 📋 Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
SESSION_SECRET=greenops-dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

---

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm install  # Already done
npm start
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and you'll see:
- **Landing Page** (entry point)
- Click "Get Started" → Auth page
- Click GitHub or Google buttons to authenticate
- After auth → Dashboard

---

## 🔗 API Endpoints

### Authentication
- `GET /auth/github` - Start GitHub OAuth flow
- `GET /auth/github/callback` - GitHub OAuth callback
- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout current user
- `GET /auth/me` - Get current logged-in user

---

## 📱 User Flow

1. User clicks **"Get Started"** on Landing page
2. Redirected to Auth page
3. User clicks **GitHub** or **Google** button
4. Redirected to provider for authentication
5. Provider redirects back to `/auth/{github|google}/callback`
6. Server validates token and creates session
7. User redirected to Dashboard with session cookie
8. Dashboard queries `/auth/me` to get user info

---

## 🔒 Production Checklist

- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS to allow production domain
- [ ] Move OAuth credentials to secure vault (AWS Secrets Manager, etc.)
- [ ] Update database (currently using memory/sessions)
- [ ] Enable HTTPS
- [ ] Set `secure: true` in session cookie config

---

## 🐛 Troubleshooting

### "Invalid credentials" error
- Check OAuth Client ID and Secret are correct
- Verify they're in `.env` file
- Restart backend server

### Redirect loop
- Check `callbackURL` matches exactly in code and OAuth provider settings
- Ensure `FRONTEND_URL` is correct in `.env`

### Session not persisting
- Check `express-session` middleware is loaded
- Verify cookie settings (sameSite, httpOnly)
- Check browser privacy settings allow cookies

---

## 📚 Files Modified

**Backend:**
- `backend/package.json` - Added passport, express-session, dotenv
- `backend/src/index.js` - Added session & passport middleware
- `backend/src/routes/auth.js` - New OAuth routes
- `backend/src/services/passport.js` - New passport strategies
- `backend/.env` - OAuth credentials & config

**Frontend:**
- `frontend/src/pages/AuthPage.tsx` - Added OAuth button handlers
