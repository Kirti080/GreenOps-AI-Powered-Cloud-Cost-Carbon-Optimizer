# Local Development: Mock Auth Setup ✅

## What I Just Set Up

You can now **test GitHub & Google login immediately** without needing real OAuth credentials!

### How It Works

- **No credentials needed** → Uses mock auth with fake user data
- **Clicks "GitHub"** → Logs in as "John GitHub Developer"  
- **Clicks "Google"** → Logs in as "Jane Google Developer"
- **Dashboard loads** with demo user

Backend logs will show:
```
⚠️  Using MOCK authentication (no real OAuth credentials detected)
   To use real GitHub/Google OAuth, add credentials to .env file
```

---

## 🚀 Test It Now

```bash
# Terminal 1 - Backend (already has mock auth built in)
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

1. Open `http://localhost:5173`
2. Click "Get Started"
3. Click **GitHub** or **Google** button
4. ✅ You'll be logged in to the dashboard!

---

## Later: Switch to Real OAuth

When you get real OAuth credentials:

**1. Get GitHub OAuth:**
- Go: https://github.com/settings/developers
- New OAuth App
- Name: `GreenOps`
- Homepage: `http://localhost:5173`
- Callback: `http://localhost:3001/auth/github/callback`
- Save the Client ID & Secret

**2. Get Google OAuth:**
- Go: https://console.cloud.google.com
- APIs & Services → Credentials
- Create OAuth 2.0 Client
- Add redirect URI: `http://localhost:3001/auth/google/callback`
- Save the Client ID & Secret

**3. Update backend/.env:**
```
GITHUB_CLIENT_ID=your_real_id
GITHUB_CLIENT_SECRET=your_real_secret
GOOGLE_CLIENT_ID=your_real_id
GOOGLE_CLIENT_SECRET=your_real_secret
```

**4. Restart backend:**
```bash
npm start
```

Now backend will log:
```
🔐 Real OAuth enabled
```

---

## 📁 Files I Created/Modified

**New:**
- `backend/src/services/mockAuth.js` - Mock user data

**Modified:**
- `backend/src/routes/auth.js` - Detects if real credentials exist, uses mock if not
- `backend/src/index.js` - Conditional passport initialization
- `backend/.env` - Placeholder credentials (commented out)

---

## ✅ Status

- ✅ Mock auth working (test now)  
- ✅ Frontend OAuth buttons connected
- ✅ Sessions configured  
- ✅ Ready for real OAuth (just add credentials)

No more setup needed for testing! 🎉
