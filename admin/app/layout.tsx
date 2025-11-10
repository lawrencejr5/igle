import type { Metadata } from "next";
import "./styles/style.scss";
import "./styles/style.responsive.scss";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AlertProvider from "./context/AlertContext";
import AdminProvider from "./context/AdminContext";
import UserProvider from "./context/UserContext";
import DriverProvider from "./context/DriverContext";
import { RideProvider } from "./context/RideContext";
import { DeliveryProvider } from "./context/DeliveryContext";

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
              <UserProvider>
                <DriverProvider>
                  <RideProvider>
                    <DeliveryProvider>{children}</DeliveryProvider>
                  </RideProvider>
                </DriverProvider>
              </UserProvider>
            </AdminProvider>
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
