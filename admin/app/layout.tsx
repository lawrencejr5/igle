import type { Metadata } from "next";
import "./styles/style.scss";
import "./styles/style.responsive.scss";

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
      <body>{children}</body>
    </html>
  );
}
