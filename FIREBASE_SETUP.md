# WineRater Firebase Setup Guide

This document provides step-by-step instructions for setting up Firebase authentication and cloud storage for your WineRater application.

## Prerequisites

- Google account
- Basic understanding of web development
- Access to your WineRater codebase

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter a project name: `WineRater`
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create Project"
6. Wait for project creation to complete and click "Continue"

## 2. Register Your Web Application

1. From the project overview page, click the web icon (`</>`)
2. Register your app with a nickname: `winerater-web`
3. Uncheck "Also set up Firebase Hosting" for now (can be added later)
4. Click "Register app"
5. Copy the Firebase configuration object that appears:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};
```

6. Click "Continue to console"

## 3. Enable Authentication Methods

### Email/Password Authentication

1. In the Firebase console, click "Authentication" in the left sidebar
2. Click "Get started" or "Sign-in method" tab
3. Click on "Email/Password" provider
4. Toggle "Enable" to ON
5. Click "Save"

### Google Authentication (Optional)

1. In the Authentication > Sign-in method tab, click "Google"
2. Toggle "Enable" to ON
3. Add a "Project support email" (your email)
4. Click "Save"

### Apple Authentication (Optional)

1. In the Authentication > Sign-in method tab, click "Apple"
2. Toggle "Enable" to ON
3. Follow the instructions to set up Apple Sign-In
   - Requires an Apple Developer account ($99/year)
   - Follow the prompts to configure your Apple services

## 4. Set Up Firestore Database

1. In the Firebase console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
   - You'll update the security rules later
4. Select a database location closest to your target users
5. Click "Enable"

## 5. Configure Security Rules

1. In Firestore Database, click the "Rules" tab
2. Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /wines/{wineId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click "Publish"

## 6. Update WineRater Code

1. Open the `index-cloud.html` file in your WineRater project
2. Find the Firebase configuration section near the bottom:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "winerater-app.firebaseapp.com",
    projectId: "winerater-app",
    storageBucket: "winerater-app.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};
```

3. Replace this with the actual configuration you copied from Firebase console

## 7. Deploy Your Application

If using GitHub Pages:

1. Commit and push your changes to GitHub:
```bash
git add index-cloud.html
git commit -m "Add Firebase configuration"
git push origin main
```

2. Your updated app will be available at your GitHub Pages URL

## 8. Testing Your Implementation

1. Visit your deployed application
2. You should see the authentication screen first
3. Create a new account
4. Verify that you can:
   - Add wines to your collection
   - Sign out and sign back in
   - See your previously added wines after signing back in

## Troubleshooting Common Issues

### Authentication Failures

- Check the browser console for specific error messages
- Verify your Firebase configuration is correctly copied
- Ensure the authentication methods are properly enabled

### Data Not Syncing

- Check Firestore database rules
- Verify your collection structure matches the expected format
- Check network connectivity

### Social Login Issues

- Ensure your OAuth configuration is complete
- For Google login, verify the domain is authorized
- For Apple login, check your Apple Developer account settings

## Next Steps

Once your basic authentication is working, you can:

1. Update security rules for production
2. Implement additional features like:
   - Shared wine collections
   - Admin dashboard
   - Data analytics
   - Export/import functionality

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Database](https://firebase.google.com/docs/firestore)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)

---

For any additional help, consult the Firebase documentation or reach out to Firebase support.