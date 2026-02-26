import type { Metadata } from "next";
import "./style.scss";

export const metadata: Metadata = {
  title: "Igle Ride",
  description: "Whatever Igle's motto is",
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
      <body>{children}</body>
    </html>
  );
}
