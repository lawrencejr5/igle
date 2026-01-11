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
import { TransactionProvider } from "./context/TransactionContext";
import { TaskProvider } from "./context/TaskContext";
import { ReportProvider } from "./context/ReportContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";

export const metadata: Metadata = {
  title: "Igle ride admin",
  description: "Admin dashboard of igle ride",
  icons: {
    icon: "/images/logo-rounded.png",
  },
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
                    <DeliveryProvider>
                      <TransactionProvider>
                        <TaskProvider>
                          <ReportProvider>
                            <FeedbackProvider>
                              <SystemSettingsProvider>
                                <ProtectedRoute>{children}</ProtectedRoute>
                              </SystemSettingsProvider>
                            </FeedbackProvider>
                          </ReportProvider>
                        </TaskProvider>
                      </TransactionProvider>
                    </DeliveryProvider>
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
