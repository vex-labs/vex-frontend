export const metadata = {
  title: "Earn Rewards | betVEX",
  description:
    "Activate your VEX rewards and earn passive income from platform fees. Stake your VEX tokens to earn USDC rewards.",
  keywords: [
    "VEX rewards",
    "staking",
    "crypto earnings",
    "passive income",
    "betVEX rewards",
    "VEX token staking",
  ],
  openGraph: {
    title: "Earn Rewards with VEX Token | betVEX",
    description:
      "Activate your VEX tokens and earn USDC rewards from platform fees.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Earn Rewards")}`,
        width: 1200,
        height: 630,
        alt: "betVEX Earn Feature",
      },
    ],
  },
};
export default function Layout({ children }) {
  return children;
}
