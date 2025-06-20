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
  const [fullName, setFullName] = useState("");
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
      const user = cred.user;

      // ✅ Save fullName, email, and role to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email: user.email,
        role,
      });

      await sendEmailVerification(user);
      alert("✅ Verification email sent! Please verify before logging in.");
      setAuthMode("login");
    } catch (err: any) {
      setError(err.message);
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
      navigate("/"); // will be handled by auth listener
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      {authMode === "signup" ? (
        <>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>
              Select Role:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="User">User</option>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <button type="submit">Sign Up</button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
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
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <p style={{ marginTop: 16 }}>
            Don't have an account?{" "}
            <button onClick={() => setAuthMode("signup")}>Sign Up</button>
          </p>
        </>
      )}
    </div>
  );
}
