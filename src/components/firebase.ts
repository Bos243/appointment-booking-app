import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyC2249ASr9FIUBnaRzKLHfV8sxxXjRPxU8",
  authDomain: "woreda-appointment.firebaseapp.com",
  projectId: "woreda-appointment",
  storageBucket: "woreda-appointment.firebasestorage.app",
  messagingSenderId: "486044756905",
  appId: "1:486044756905:web:e17aa71a8f4ae06c47f2b8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
