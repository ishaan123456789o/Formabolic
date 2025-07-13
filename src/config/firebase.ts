// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your Firebase project configuration
// You can find these values in your Firebase Console:
// 1. Go to console.firebase.google.com
// 2. Select your project
// 3. Click the gear icon (Project Settings)
// 4. Scroll down to "Your apps" section
// 5. Click the web icon (</>)
// 6. Register your app and copy the configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0ca1BMh9UHvhow1OWwQQB_f0_bwtwl8E",
  authDomain: "gym-assistant-f57d3.firebaseapp.com",
  projectId: "gym-assistant-f57d3",
  storageBucket: "gym-assistant-f57d3.firebasestorage.app",
  messagingSenderId: "689124070528",
  appId: "1:689124070528:web:dcf975c368e98131a34265",
  measurementId: "G-VYWEZDR3VG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); 