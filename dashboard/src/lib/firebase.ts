import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyA3CCmJgj8Wu5PCs9ebuNE-0hKKtaPfa6I',
  authDomain: 'vendormind-z.firebaseapp.com',
  projectId: 'vendormind-z',
  storageBucket: 'vendormind-z.firebasestorage.app',
  messagingSenderId: '202819225446',
  appId: '1:202819225446:web:5d5c97f206aa2dea00eaa7',
  measurementId: 'G-C175C21559',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics only runs in browser (not SSR/build)
isSupported().then((yes) => {
  if (yes) getAnalytics(app);
});
