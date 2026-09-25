import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calibo Student Dashboard",
  description: "Student dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}