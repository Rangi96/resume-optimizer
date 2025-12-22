import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

console.log('🔥 Firebase Config Check:');
console.log('🔥 VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('🔥 VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('🔥 VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('🔥 VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('🔥 Firebase app initialized:', app ? 'SUCCESS' : 'FAILED');

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
console.log('🔥 Firebase Auth initialized:', auth ? 'SUCCESS' : 'FAILED');

// Initialize Firestore
export const db = getFirestore(app);
console.log('🔥 Firestore initialized:', db ? 'SUCCESS' : 'FAILED');
console.log('🔥 Firestore db object:', db);

export default app;