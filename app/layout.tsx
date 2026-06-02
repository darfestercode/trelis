import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";
import { GoalProgressProvider } from "./components/GoalProgressContext";
import { UserProvider } from "./components/UserContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trelis - Connect with Global Mentors & Peers",
  description:
    "Trelis is the global student networking platform for extracurricular opportunities, research collaborations, and mentorship",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 overflow-x-hidden">
        <ThemeProvider>
          <UserProvider>
            <GoalProgressProvider>{children}</GoalProgressProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
