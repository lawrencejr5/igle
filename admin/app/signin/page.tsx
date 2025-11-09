"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuthContext } from "../context/AuthContext";

const SigninPage = () => {
  const router = useRouter();
  const { login, isSignedIn, loading: authLoading } = useAuthContext();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!authLoading && isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, authLoading, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      // Redirect to dashboard on successful login
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render form if already authenticated
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect via useEffect
  }

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

        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: 6,
              color: "#c33",
            }}
          >
            {error}
          </div>
        )}

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
              onChange={(event) => setIdentifier(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
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
