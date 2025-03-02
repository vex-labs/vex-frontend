export const metadata = {
  title: "User Bets | betVEX",
  description: "View betting histor and rewards earned on betVEX.",
  keywords: [
    "betting profile",
    "esports bettor",
    "VEX rewards",
    "betting history",
    "betVEX account",
  ],
  openGraph: {
    title: "User Bets | betVEX",
    description: "View betting histor and rewards earned on betVEX.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("User Bets")}`,
        width: 1200,
        height: 630,
        alt: "betVEX User Bets",
      },
    ],
  },
};

export default function UserLayout({ children }) {
  return children;
}
