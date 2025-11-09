import type { Metadata } from "next";
import "./styles/style.scss";
import "./styles/style.responsive.scss";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AlertProvider from "./context/AlertContext";
import AdminProvider from "./context/AdminContext";

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
            <AdminProvider>
              <ProtectedRoute>{children}</ProtectedRoute>
            </AdminProvider>
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
