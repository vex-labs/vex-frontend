export const metadata = {
  title: "BetVEX Earn",
  description: "Put your VEX Rewards to work and earn your share from BetVEX",
  keywords: [
    "VEX Rewards",
    "VEX Earn",
    "BetVEX Earn",
    "VEX token",
    "BetVEX token",
    "Activate VEX",
    "Activate VEX Rewards",
  ],
  openGraph: {
    title: "BetVEX Earn",
    description: "Put your VEX Rewards to work and earn your share from BetVEX",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Earn Rewards")}`,
        width: 1200,
        height: 630,
        alt: "BetVEX Earn Feature",
      },
    ],
  },
};
export default function Layout({ children }) {
  return children;
}
