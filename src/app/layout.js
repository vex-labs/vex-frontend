import React from "react";
import { Exo, Asap } from "next/font/google";
import Providers from "./providers";
import AppLayout from "@/components/AppLayout";
import "./globals.css";

// Initialize fonts
const exo = Exo({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const asap = Asap({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://testnet.betvex.xyz";

export const metadata = {
  title: {
    default: "betVEX - Community Powered Esports Betting Platform",
    template: "%s | betVEX",
  },
  description:
    "betVEX is a next-generation esports betting platform that puts its future in its user's hands with better odds, guaranteed payouts, and community rewards.",
  keywords: [
    "betVEX",
    "esports betting",
    "esports",
    "betting platform",
    "crypto betting",
    "community powered",
    "VEX token",
    "blockchain betting",
    "better odds",
    "gaming",
    "esports wagers",
    "decentralized betting",
  ],
  authors: [{ name: "Vex Labs Ltd" }],
  creator: "Vex Labs Ltd",
  publisher: "Vex Labs Ltd",
  category: "Esports Betting",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "betVEX - Community Powered Esports Betting Platform",
    description:
      "The only community powered esports betting platform with better odds and community rewards.",
    siteName: "betVEX",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Betting")}`,
        width: 1200,
        height: 630,
        alt: "betVEX Platform",
      },
    ],
  },
};

/**
 * RootLayout component
 *
 * This component serves as the root layout for the application
 * It provides the global context providers and font configurations
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout
 * @returns {JSX.Element} The rendered RootLayout component
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      style={{
        "--font-primary": asap.style.fontFamily,
        "--font-heading": exo.style.fontFamily,
      }}
    >
      <body className={asap.className}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
