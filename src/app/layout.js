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
