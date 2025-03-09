export const metadata = {
  title: "BetVEX Leaderboard",
  description:
    "See how you stack up against other bettors in the BetVEX community",
  keywords: ["Leaderboard", "VEX leaderboard", "Competitive"],
  openGraph: {
    title: "BetVEX Leaderboard",
    description:
      "See how you stack up against other bettors in the BetVEX community",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Leaderboard")}`,
        width: 1200,
        height: 630,
        alt: "BetVEX Leaderboard",
      },
    ],
  },
};

export default function LeaderboardLayout({ children }) {
  return children;
}
