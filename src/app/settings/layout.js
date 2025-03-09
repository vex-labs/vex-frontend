export const metadata = {
  title: "Account Settings | betVEX",
  description:
    "Manage your betVEX account settings, privacy preferences, and notification options.",
  keywords: [
    "account settings",
    "betting preferences",
    "betVEX account",
    "betting profile",
  ],
  openGraph: {
    title: "Account Settings | betVEX",
    description:
      "Manage your betVEX account settings, privacy preferences, and notification options.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Account Settings")}`,
        width: 1200,
        height: 630,
        alt: "betVEX Settings",
      },
    ],
  },
};

export default function SettingsLayout({ children }) {
  return children;
}
