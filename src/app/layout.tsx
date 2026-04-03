import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "VitaLink — Online Doctor Appointment & Digital Consultation",
  description: "Book verified doctors, get AI-powered triage, and manage your health records with VitaLink's secure healthcare platform.",
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
            duration: 4000,
            style: {
              background: '#0a0a0a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#000',
              },
              style: {
                borderColor: 'rgba(16,185,129,0.3)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#000',
              },
              style: {
                borderColor: 'rgba(239,68,68,0.3)',
              },
            },
          }}
        />
        </LanguageProvider>
      </body>
    </html>
  );
}
