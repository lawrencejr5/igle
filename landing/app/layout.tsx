import type { Metadata } from "next";
import "./style.scss";

export const metadata: Metadata = {
  title: "Igle - Ride Hailing & Package Delivery",
  description: "The all-in-one app for reliable rides and swift package deliveries.",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
