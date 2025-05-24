# Running WineRater Locally

Due to Firebase authentication requirements, WineRater must be served over HTTP (not file://).

## Quick Start

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm start
   ```

3. Open your browser to: http://localhost:8080

## Important Notes

- **Do NOT open index.html directly** as a file:// URL - Firebase auth won't work
- Make sure to allow popups for localhost:8080 for Google sign-in
- The server runs on port 8080 by default

## Troubleshooting

If sign-in isn't working:
1. Check browser console for errors
2. Ensure popups are allowed for localhost:8080
3. Try clearing browser cache/cookies
4. Use an incognito/private window

## Development

The server (server.js) serves static files from the current directory.