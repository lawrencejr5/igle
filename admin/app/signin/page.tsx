"use client";

import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SigninPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: replace with real auth call
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    alert(`Signed in as: ${identifier}`);
  };

  return (
    <div
      className="page-content page-content--auth"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <main className="auth-card" style={{ width: 480, maxWidth: "94%" }}>
        <img src="/images/logo.png" alt="Igle" className="auth-card__logo" />
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 className="page__title" style={{ fontSize: 28 }}>
            Admin Sign in
          </h1>
          <p className="page__subtitle" style={{ marginTop: 8 }}>
            Enter your credentials to access the dashboard
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="settings-form-group" style={{ marginBottom: 16 }}>
            <label className="settings-form-group__label" htmlFor="identifier">
              Username or Email
            </label>
            <input
              id="identifier"
              className="settings-form-group__input"
              placeholder="you@company.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="settings-form-group" style={{ marginBottom: 8 }}>
            <label className="settings-form-group__label" htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="settings-form-group__input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  padding: 6,
                  cursor: "pointer",
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SigninPage;
