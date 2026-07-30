# Frontend Deployment Guide (Firebase Hosting)

Guide for building and deploying the VendorMind Vite React Dashboard and Landing Page to Firebase Hosting.

---

## 🏗️ Build Production Bundle

```bash
cd dashboard
bun run build
```

This compiles the production single-page application into `dashboard/dist/`.

---

##  Firebase Hosting Deploy

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase Hosting
firebase deploy --only hosting
```
