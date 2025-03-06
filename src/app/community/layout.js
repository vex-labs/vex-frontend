export const metadata = {
  title: "BetVEX Community",
  description:
    "The future of BetVEX is in your hands, decide how BetVEX should operate",
  keywords: [
    "Community",
    "VEX community",
    "VEX governance",
    "BetVEX governance",
    "Governance",
    "DAO",
    "VEX DAO",
    "BetVEX DAO",
    "Decentralized Autonomous Organization",
    "Decentralized Autonomous Organisation",
  ],
  openGraph: {
    title: "BetVEX Community",
    description:
      "The future of BetVEX is in your hands, decide how BetVEX should operate",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Community")}`,
        width: 1200,
        height: 630,
        alt: "BetVEX Community",
      },
    ],
  },
};
export default function CommunityLayout({ children }) {
  return children;
}
