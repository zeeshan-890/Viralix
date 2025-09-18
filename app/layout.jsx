import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInit from "../src/store/ThemeInit";
import AuthInit from "../src/store/AuthInit";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata = {
  title: "AutoReach AI - AI-Powered Social Media Management",
  description: "Automate your social media content across TikTok, YouTube, Instagram, and LinkedIn with AI-powered optimization.",
};
export default function RootLayout({ children, }) {
  return (<html lang="en">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <ThemeInit />
      <AuthInit />
      {children}
    </body>
  </html>);
}
