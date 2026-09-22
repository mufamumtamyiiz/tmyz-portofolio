// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDWHNF82JHNYgxshEbI1iIFLaDjKaHU2ns",
  authDomain: "portofolio-tmyiiz.firebaseapp.com",
  projectId: "portofolio-tmyiiz",
  storageBucket: "portofolio-tmyiiz.firebasestorage.app",
  messagingSenderId: "1095760505296",
  appId: "1:1095760505296:web:19d5d1395fccc828a331d5",
  measurementId: "G-W9P993SZV3"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Auth
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

// Firestore
export const db = getFirestore(app);
