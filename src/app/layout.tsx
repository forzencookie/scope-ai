import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scope AI | Automatiserad bokföring för svenska företag",
  description: "Scope AI är en intelligent bokföringsplattform som automatiserar bokföring, moms, löner och ekonomisk rapportering för svenska företag. Spara tid och få kontroll över din ekonomi.",
  keywords: ["bokföring", "redovisning", "moms", "löner", "AI", "automation", "Sverige", "företag", "ekonomi"],
  authors: [{ name: "Scope AI" }],
  creator: "Scope AI",
  openGraph: {
    title: "Scope AI | Automatiserad bokföring för svenska företag",
    description: "Intelligent bokföringsplattform som automatiserar bokföring, moms, löner och ekonomisk rapportering.",
    type: "website",
    locale: "sv_SE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scope AI | Automatiserad bokföring för svenska företag",
    description: "Intelligent bokföringsplattform som automatiserar bokföring, moms, löner och ekonomisk rapportering.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
