import type { Metadata } from "next";
import "./styles/style.scss";
import "./styles/style.responsive.scss";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AlertProvider from "./context/AlertContext";

export const metadata: Metadata = {
  title: "Igle ride admin",
  description: "Admin dashboard of igle ride",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AlertProvider>
          <AuthProvider>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
