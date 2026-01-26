// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHwO7FV4rGZ2wtfGmcKskykLGt83YNhvQ",
  authDomain: "road-signalement-s5.firebaseapp.com",
  projectId: "road-signalement-s5",
  storageBucket: "road-signalement-s5.firebasestorage.app",
  messagingSenderId: "116450123240",
  appId: "1:116450123240:web:54d98bc8ecb609926a185d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);