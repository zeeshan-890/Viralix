import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInit from "../src/store/ThemeInit";
import AuthInit from "../src/store/AuthInit";
import QueryProvider from "../src/items/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Viralix - AI-Powered Social Media Management",
  description: "Automate your social media content across TikTok, YouTube, Instagram, and LinkedIn with AI-powered optimization.",
};

export default function RootLayout({ children, }) {
  return (
    <html lang="en">
      <head>
        <meta name="facebook-domain-verification" content="mtzxn07hoticb1c3uls3fp23wo23o6" />
        <link rel="icon" href="/viralix_logo.png" />
        <link rel="apple-touch-icon" href="/viralix_logo.png" />
        <meta name="theme-color" content="#84A98C" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeInit />
          <AuthInit />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
