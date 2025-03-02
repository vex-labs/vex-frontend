export const metadata = {
  title: "Leaderboard | betVEX",
  description:
    "Check out the top bettors on betVEX. See who's leading in wins, profits, and betting volume across different esports games.",
  keywords: [
    "esports leaderboard",
    "betting leaderboard",
    "top bettors",
    "esports betting ranks",
    "betVEX rankings",
  ],
  openGraph: {
    title: "betVEX Leaderboard | Top Esports Bettors",
    description:
      "See who's winning big on betVEX. View top players ranked by profits, win rate, and betting volume.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Leaderboard")}`,
        width: 1200,
        height: 630,
        alt: "betVEX Leaderboard",
      },
    ],
  },
};

export default function LeaderboardLayout({ children }) {
  return children;
}
