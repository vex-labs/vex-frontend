"use client";
import "./earn.css";
import Staking from "@/components/Stake";
import Swap from "@/components/Swap";
import Sidebar2 from "@/components/Sidebar2";
import { useNear } from "@/app/context/NearContext";
import { Wallet, Coins, ArrowUpDown } from "lucide-react";
import { useGlobalContext } from "../context/GlobalContext";
import { useEffect, useState } from "react";

const EarnPage = () => {
  const nearContext = useNear();
  const { tokenBalances } = useGlobalContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";

  const wallet = isVexLogin ? null : nearContext?.wallet || null;
  const signedAccountId = isVexLogin
    ? null
    : nearContext?.signedAccountId || null;

  // Check sidebar state on component mount and when DOM changes
  useEffect(() => {
    // Initial check
    checkSidebarState();

    // Set up a mutation observer to detect sidebar class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          checkSidebarState();
        }
      });
    });

    // Start observing the sidebar element
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }

    // Clean up the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  // Function to check if sidebar is collapsed
  const checkSidebarState = () => {
    if (typeof document !== "undefined") {
      const sidebarElement = document.querySelector(".sidebar");
      if (sidebarElement) {
        setIsSidebarCollapsed(sidebarElement.classList.contains("collapsed"));
      }
    }
  };

  return (
    <div
      className={`earn-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
      style={{
        marginLeft: isSidebarCollapsed ? "60px" : "230px",
      }}
    >
      <Sidebar2 />

      <div className="earn-page-content">
        <div className="earn-page-header">
          <h1 className="earn-page-title">Earn & Manage</h1>
          <p className="earn-page-description">
            Swap tokens and stake VEX to earn rewards in the BetVEX ecosystem
          </p>
        </div>

        <div className="earn-stats">
          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <Wallet size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">
                {tokenBalances?.VEX || "0"}
              </span>
              <span className="earn-stat-label">VEX Balance</span>
            </div>
          </div>

          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <Coins size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">
                {tokenBalances?.USDC || "0"}
              </span>
              <span className="earn-stat-label">USDC Balance</span>
            </div>
          </div>

          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <ArrowUpDown size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">24/7</span>
              <span className="earn-stat-label">Trading Available</span>
            </div>
          </div>
        </div>

        <div className="earn-sections">
          <div className="earn-section-header">
            <h2 className="earn-section-title">Manage Your Assets</h2>
          </div>

          <div className="earn-container">
            <div className="earn-card swap-section">
              <div className="earn-card-header">
                <h3 className="earn-card-title">
                  <ArrowUpDown size={18} />
                  Token Swap
                </h3>
                <div className="earn-card-subtitle">
                  Exchange VEX and USDC tokens instantly
                </div>
              </div>

              <Swap
                wallet={wallet}
                signedAccountId={signedAccountId}
                isVexLogin={isVexLogin}
              />
            </div>

            <div className="earn-card stake-section">
              <div className="earn-card-header">
                <h3 className="earn-card-title">
                  <Coins size={18} />
                  VEX Staking
                </h3>
                <div className="earn-card-subtitle">
                  Stake your VEX tokens to earn rewards
                </div>
              </div>

              <Staking
                wallet={wallet}
                signedAccountId={signedAccountId}
                isVexLogin={isVexLogin}
              />
            </div>
          </div>
        </div>

        <div className="earn-faq-section">
          <h2 className="earn-section-title">Frequently Asked Questions</h2>

          <div className="earn-faq-container">
            <div className="earn-faq-item">
              <h3 className="earn-faq-question">What is VEX token?</h3>
              <p className="earn-faq-answer">
                VEX is the utility token of the BetVEX platform. It can be used
                for betting, staking, and earning rewards in the ecosystem.
              </p>
            </div>

            <div className="earn-faq-item">
              <h3 className="earn-faq-question">How does staking work?</h3>
              <p className="earn-faq-answer">
                Staking allows you to lock your VEX tokens in the staking
                contract to earn USDC rewards. The more VEX you stake and the
                longer you stake it, the more rewards you can earn.
              </p>
            </div>

            <div className="earn-faq-item">
              <h3 className="earn-faq-question">
                Can I unstake my tokens at any time?
              </h3>
              <p className="earn-faq-answer">
                Yes, you can unstake your VEX tokens at any time without
                penalties. Once unstaked, you can withdraw your tokens back to
                your wallet.
              </p>
            </div>

            <div className="earn-faq-item">
              <h3 className="earn-faq-question">
                How do I swap between VEX and USDC?
              </h3>
              <p className="earn-faq-answer">
                Use the Token Swap feature to exchange between VEX and USDC
                tokens. The swap is processed through the REF Finance platform,
                ensuring the best rates and liquidity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarnPage;
