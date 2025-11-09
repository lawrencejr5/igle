"use client";

import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, loading, token, logout } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (pathname === "/signin") return;

    // Check token expiration and role
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check expiration
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          logout();
          router.push("/signin");
          return;
        }
        // Check role is admin
        if (!decoded.role || decoded.role !== "admin") {
          logout();
          router.push("/signin");
          return;
        }
      } catch (e) {
        // If token is invalid, logout
        logout();
        router.push("/signin");
        return;
      }
    }

    if (!isSignedIn) {
      router.push("/signin");
    }
  }, [isSignedIn, loading, pathname, router, token, logout]);

  if (loading) {
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
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: 16, color: "#666" }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (pathname === "/signin") {
    return <>{children}</>;
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
