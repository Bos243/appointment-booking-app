// LoginPage.tsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { Role } from "./types";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"signup" | "login" | "forgot">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("User");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

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
      navigate("/"); // handled by auth listener
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      {authMode === "signup" && (
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
            <button onClick={() => { setError(""); setAuthMode("login"); }}>
              Login
            </button>
          </p>
        </>
      )}

      {authMode === "login" && (
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
            <button onClick={() => { setError(""); setAuthMode("signup"); }}>
              Sign Up
            </button>
          </p>
          <p style={{ marginTop: 8 }}>
            <button
              style={{ background: "none", border: "none", color: "#1e4d6b", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              onClick={() => { setError(""); setMessage(""); setAuthMode("forgot"); }}
            >
              Forgot Password?
            </button>
          </p>
        </>
      )}

      {authMode === "forgot" && (
        <>
          <h2>Reset Password</h2>
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Email</button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
          <p style={{ marginTop: 16 }}>
            Remember your password?{" "}
            <button onClick={() => { setError(""); setMessage(""); setAuthMode("login"); }}>
              Login
            </button>
          </p>
        </>
      )}
    </div>
  );
}
