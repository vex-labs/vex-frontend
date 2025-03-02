export const metadata = {
  title: "Community | betVEX",
  description:
    "Join the betVEX community and participate in giveaways, competitions, bounties, challenges, grants, events, and governance.",
  keywords: [
    "esports community",
    "betVEX community",
    "crypto community",
    "gaming community",
    "VEX holders",
  ],
  openGraph: {
    title: "Join the betVEX Community | Esports Betting Platform",
    description:
      "Connect with like-minded esports enthusiasts and participate in community events, governance and rewards.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Community")}`,
        width: 1200,
        height: 630,
        alt: "betVEX Community",
      },
    ],
  },
};
export default function CommunityLayout({ children }) {
  return children;
}
