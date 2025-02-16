"use client";
import FAQ from "@/components/Faq";
import "./earn.css";
import Staking from "@/components/Stake";
import Swap from "@/components/Swap";
import Sidebar2 from "@/components/Sidebar2";
import { useNear } from "@/app/context/NearContext"; // Import useNear at the top level

const EarnPage = () => {
  const nearContext = useNear(); // Always call useNear here
  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";

  const wallet = isVexLogin ? null : nearContext?.wallet || null;
  const signedAccountId = isVexLogin
    ? null
    : nearContext?.signedAccountId || null;

  console.log("isVexLogin:", isVexLogin);

  return (
    <div className="earn-page">
      <Sidebar2 />
      <div className="earn-container">
        <div className="swap-section">
          <Swap
            wallet={wallet}
            signedAccountId={signedAccountId}
            isVexLogin={isVexLogin}
          />
        </div>

        <div className="stake-section">
          <Staking
            wallet={wallet}
            signedAccountId={signedAccountId}
            isVexLogin={isVexLogin}
          />
        </div>
      </div>
    </div>
  );
};

export default EarnPage;
