export const metadata = {
  title: "BetVEX Bets",
  description: "View and claim your bets made on BetVEX",
  keywords: [
    "Bets",
    "VEX Bets",
    "Claim bets",
    "BetVEX claim bets",
    "Claim VEX bets",
    "Claim BetVEX bets",
  ],
  openGraph: {
    title: "BetVEX Bets",
    description: "View and claim your bets made on BetVEX",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Bets")}`,
        width: 1200,
        height: 630,
        alt: "BetVEX Bets",
      },
    ],
  },
};

export default function UserLayout({ children }) {
  return children;
}
