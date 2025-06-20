// App.tsx
import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./components/firebase";
import { AppUser, Role } from "./components/types";
import UserDashboard from "./components/UserDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import "./App.css";

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user);
      setLoading(true);
      setFirebaseUser(user);

      if (user) {
        if (!user.emailVerified) {
          console.log("Email not verified.");
          setAppUser(null);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("User role data fetched:", data.role);
          setAppUser({
            uid: user.uid,
            email: user.email,
            role: data.role as Role,
          });
        } else {
          console.log("User role not found in Firestore, signing out.");
          await signOut(auth);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  // Show verification reminder if user is logged in but not verified
  if (firebaseUser && !firebaseUser.emailVerified) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>📩 Please Verify Your Email</h2>
        <p>
          A verification email has been sent to{" "}
          <strong>{firebaseUser.email}</strong>. Please verify your email and
          then log in again.
        </p>
        <button onClick={handleLogout} style={{ marginTop: 20 }}>
          Log Out
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!firebaseUser ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={
            loading ? (
              <div style={{ padding: 40 }}>Loading dashboard...</div>
            ) : firebaseUser && appUser ? (
              <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
                <h1>Welcome, {appUser.email}</h1>
                <button onClick={handleLogout} style={{ marginBottom: 20 }}>
                  Logout
                </button>

                {appUser.role === "User" && <UserDashboard uid={appUser.uid} />}
                {appUser.role === "Employee" && (
                  <EmployeeDashboard uid={appUser.uid} />
                )}
                {appUser.role === "Admin" && <AdminDashboard />}
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
