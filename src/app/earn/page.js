"use client";
import "./earn.css";
import Staking from "@/components/Stake";
import Swap from "@/components/Swap";
import Sidebar2 from "@/components/Sidebar2";
import { DollarSign, Coins, ArrowUpDown } from "lucide-react";
import { useGlobalContext } from "../context/GlobalContext";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import { VexContract, NearRpcUrl } from "@/app/config";

const EarnPage = () => {
  const { accountId } = useGlobalContext();
  const { tokenBalances } = useGlobalContext();
  const provider = new providers.JsonRpcProvider(NearRpcUrl);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  const fetchStakedBalance = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString("base64");
      const result = await provider.query({
        request_type: "call_function",
        account_id: VexContract,
        method_name: "get_user_staked_bal",
        args_base64: encodedArgs,
        finality: "final",
      });

      const resultString = Buffer.from(result.result).toString();
      // Parse as JSON to access U128 structure
      const parsedResult = JSON.parse(resultString);
      const stakedBalanceRaw = parseFloat(parsedResult) / 1e18;

      // Round to 2 decimal places
      const roundedBalance = isNaN(stakedBalanceRaw)
        ? 0
        : parseFloat(stakedBalanceRaw.toFixed(2));
      setStakedBalance(roundedBalance);
    } catch (error) {
      console.error("Error fetching staked balance:", error);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchStakedBalance(accountId);
    }
  }, [accountId, tokenBalances]);

  return (
    <div className={`earn-page`}>
      <Sidebar2 />

      <div className="earn-page-content">
        <div className="earn-page-header">
          <h1 className="earn-page-title">Earn & Manage</h1>
          <p className="earn-page-description">
            Swap tokens and activate VEX Rewards to earn rewards in the BetVEX
            ecosystem
          </p>
        </div>

        <div className="earn-stats">
          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <Coins size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">
                {parseFloat(tokenBalances?.VEX || "0").toFixed(2)}
              </span>
              <span className="earn-stat-label">VEX Balance</span>
            </div>
          </div>

          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <DollarSign size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">
                {parseFloat(tokenBalances?.USDC || "0").toFixed(2)}
              </span>
              <span className="earn-stat-label">USD Balance</span>
            </div>
          </div>

          <div className="earn-stat-card">
            <div className="earn-stat-icon">
              <ArrowUpDown size={20} />
            </div>
            <div className="earn-stat-content">
              <span className="earn-stat-value">
                {parseFloat(stakedBalance).toFixed(2)}
              </span>
              <span className="earn-stat-label">Activated VEX Rewards</span>
            </div>
          </div>
        </div>

        <div className="earn-sections">
          <div className="earn-section-header">
            <h2 className="earn-section-title">Manage Your Assets</h2>
          </div>

          <div className="earn-container">
            <div className="earn-card swap-section">
              <Swap />
            </div>

            <div className="earn-card stake-section">
              <Staking />
            </div>
          </div>
        </div>

        <div className="earn-faq-section">
          <h2 className="earn-section-title">Frequently Asked Questions</h2>

          <div className="earn-faq-container">
            <div
              className={`earn-faq-item ${activeFaq === 0 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}
            >
              <h3 className="earn-faq-question">What is VEX token?</h3>
              <p className="earn-faq-answer">
                VEX is the utility token of the BetVEX platform. It can be used
                for betting, staking, and earning rewards in the ecosystem.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 1 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
            >
              <h3 className="earn-faq-question">How does staking work?</h3>
              <p className="earn-faq-answer">
                Staking allows you to lock your VEX tokens in the staking
                contract to earn USD rewards. The more VEX you activate and the
                longer you activate it, the more rewards you can earn.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 2 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
            >
              <h3 className="earn-faq-question">
                Can I deactivate my tokens at any time?
              </h3>
              <p className="earn-faq-answer">
                Yes, you can deactivate your VEX tokens at any time without
                penalties. Once deactivated, you can withdraw your tokens back
                to your wallet.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 3 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
            >
              <h3 className="earn-faq-question">
                How do I swap between VEX and USD?
              </h3>
              <p className="earn-faq-answer">
                Use the Token Swap feature to exchange between VEX and USD
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
