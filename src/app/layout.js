import RootLayout from "./root-layout";

export const metadata = {
  title: "App | BetVex",
  description: "BetVex Esports by Vex Labs",
};

export default function Layout({ children }) {
  return <RootLayout>{children}</RootLayout>;
}
