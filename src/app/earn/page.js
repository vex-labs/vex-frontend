"use client";
import "./earn.css";
import Staking from "@/components/Stake";
import Swap from "@/components/Swap";
import Sidebar2 from "@/components/Sidebar2";
import { useNear } from "@/app/context/NearContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { Wallet, Coins, ArrowUpDown } from "lucide-react";
import { useGlobalContext } from "../context/GlobalContext";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import { VexContract, NearRpcUrl } from "@/app/config";

const EarnPage = () => {
  const { accountId } = useGlobalContext();
  const { tokenBalances } = useGlobalContext();
  const provider = new providers.JsonRpcProvider(NearRpcUrl);
  const [stakedBalance, setStakedBalance] = useState(0);

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

      setStakedBalance(isNaN(stakedBalanceRaw) ? 0 : stakedBalanceRaw);
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
              <span className="earn-stat-value">{stakedBalance}</span>
              <span className="earn-stat-label">Activated $VEX Rewards</span>
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

              <Swap />
            </div>

            <div className="earn-card stake-section">
              <div className="earn-card-header">
                <h3 className="earn-card-title">
                  <Coins size={18} />
                  Activate VEX Rewards
                </h3>
                <div className="earn-card-subtitle">
                  Activate your VEX Rewards to earn rewards
                </div>
              </div>

              <Staking />
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
                contract to earn USDC rewards. The more VEX you activate and the
                longer you activate it, the more rewards you can earn.
              </p>
            </div>

            <div className="earn-faq-item">
              <h3 className="earn-faq-question">
                Can I deactivate my tokens at any time?
              </h3>
              <p className="earn-faq-answer">
                Yes, you can deactivate your VEX tokens at any time without
                penalties. Once deactivated, you can withdraw your tokens back
                to your wallet.
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
