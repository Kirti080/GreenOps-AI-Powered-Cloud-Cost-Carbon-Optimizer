// ─────────────────────────────────────────────────────────────────────────────
// Mock Auth Service for Development
// Simulates GitHub & Google OAuth without needing real credentials
// ─────────────────────────────────────────────────────────────────────────────

const mockUsers = {
  github: {
    id: 'github-12345',
    username: 'dev-user-github',
    displayName: 'John GitHub Developer',
    emails: [{ value: 'john.github@example.com' }],
    photos: [{ value: 'https://avatars.githubusercontent.com/u/1?v=4' }],
    provider: 'github',
  },
  google: {
    id: 'google-67890',
    displayName: 'Jane Google Developer',
    email: 'jane.google@example.com',
    emails: [{ value: 'jane.google@example.com' }],
    photos: [{ value: 'https://lh3.googleusercontent.com/a/default-user' }],
    provider: 'google',
  },
};

export const getMockUser = (provider) => {
  return mockUsers[provider] || mockUsers.github;
};

export const mockAuthMiddleware = (req, res, next) => {
  const provider = req.path.includes('github') ? 'github' : 'google';
  req.user = getMockUser(provider);
  next();
};
