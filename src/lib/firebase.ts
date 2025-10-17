import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCSOVLGq-bjFxc0vqGok9D56_NcLX-cWd4",
  authDomain: "eduplatform-sih.firebaseapp.com",
  projectId: "eduplatform-sih",
  
  // PASTE YOUR REAL BUCKET NAME HERE (without gs://)
  storageBucket: "eduplatform-sih.firebasestorage.app", 
  
  messagingSenderId: "146330011173",
  appId: "1:146330011173:web:be145d40adf5024e4c61cc",
  measurementId: "G-WXCQZ58XYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;