// LoginPage.tsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { Role } from "./types";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"signup" | "login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("User");
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created: ", cred.user.email);

    // Save user role in Firestore
    await setDoc(doc(db, "users", cred.user.uid), { role });

    // IMPORTANT: Force Firebase Auth user to reload so emailVerified is accurate
    await cred.user.reload();

    // Send verification email explicitly after reload
    await sendEmailVerification(cred.user);
    console.log("Verification email sent");

    alert(`Verification email sent to ${cred.user.email}. Please check your inbox (and spam).`);

    // Sign out immediately so user can't log in without verification
    await signOut(auth);

    setAuthMode("login");
  } catch (error: any) {
    console.error("Signup failed:", error);
      setError(error.message);
    }
  };
  
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setError("⚠️ Email not verified.");
          return;
        }
        // Redirect will be handled by App.tsx after auth state update
        navigate("/");
      } catch (err: any) {
        setError(err.message);
      }
    };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      {authMode === "signup" ? (
        <>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <label>
              Select Role:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
              >
                <option value="User">User</option>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <button type="submit" style={{ padding: 10, width: "100%" }}>
              Sign Up
            </button>
          </form>
          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          <p style={{ marginTop: 16 }}>
            Already have an account?{" "}
            <button onClick={() => setAuthMode("login")}>Login</button>
          </p>
        </>
      ) : (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <button type="submit" style={{ padding: 10, width: "100%" }}>
              Login
            </button>
          </form>
          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          <p style={{ marginTop: 16 }}>
            Don't have an account?{" "}
            <button onClick={() => setAuthMode("signup")}>Sign Up</button>
          </p>
        </>
      )}
    </div>
  );
}