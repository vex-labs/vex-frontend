import React, { Suspense } from "react";
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
  title: "BetVEX - Community Powered Esports Betting",
  description:
    "BetVEX is the Community Powered Esports Betting Platform. Bet on your favorite esports matches, compete against your friends, share the revenue the platform generates, and decide the future of betVEX.",
  keywords: [
    "Esports betting",
    "Esports",
    "Betting",
    "Esports gambling",
    "Esports prediction market",
    "Prediction market",
    "Betting platform",
    "Crypto betting",
    "Community",
    "VEX token",
    "Blockchain betting",
    "Esports wagers",
    "Community powered esports betting",
    "Community powered",
    "VEX Rewards",
    "BetVEX betting",
  ],
  category: "Esports betting",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "BetVEX - Community Powered Esports Betting",
    description:
      "BetVEX is the Community Powered Esports Betting Platform. Bet on your favorite esports matches, compete against your friends, share the revenue the platform generates, and decide the future of betVEX.",
    siteName: "BetVEX",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Betting")}`,
        width: 1200,
        height: 630,
        alt: "BetVEX Platform",
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
          <Suspense>
            <AppLayout>{children}</AppLayout>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
