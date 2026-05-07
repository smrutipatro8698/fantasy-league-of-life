# Fantasy League of Life — Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- A Firebase project

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Firestore Database** → Start in production mode.
4. Register a **Web app** and copy the config values.
5. Open `src/config/firebase.ts` and replace the placeholder values with your config.

### Firestore Security Rules
Deploy these rules in the Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /competitions/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    match /activities/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    match /submissions/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

### Firestore Indexes
Create a composite index for the leaderboard query:
- Collection: `submissions`
- Fields: `competitionId` (ASC), `timestamp` (DESC)

## 2. Making a user an Admin

After a user registers, go to Firebase Console → Firestore → `users` collection, find their document, and set `isAdmin: true`. They will see the Admin tab on next app launch.

## 3. Install & Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.
