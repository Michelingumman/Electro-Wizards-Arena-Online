import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBOxDhpwz-0xKGeLWqV7VYxkJU_5cuFGBw",
  authDomain: "not-enough-mana.firebaseapp.com",
  projectId: "not-enough-mana",
  storageBucket: "not-enough-mana.appspot.com",
  messagingSenderId: "339440159416",
  appId: "1:339440159416:web:9a8f9b0f8f9b0f8f9b0f8f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);