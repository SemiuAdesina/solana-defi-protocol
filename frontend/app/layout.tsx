import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana DeFi Protocol",
  description: "Audit-ready Solana dApp UI"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" style={{ width: '100%', height: '100%' }}>
      <body className={inter.className} style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
              color: '#ffffff',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
            success: {
              iconTheme: {
                primary: '#34d399',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f87171',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#60a5fa',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
