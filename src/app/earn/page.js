"use client";
import "./earn.css";
import Staking from "@/components/Stake";
import Swap from "@/components/Swap";
import RewardsDistribution from "@/components/RewardsDistribution";
import Sidebar2 from "@/components/Sidebar2";
import { DollarSign, Coins, HandCoins } from "lucide-react";
import { useGlobalContext } from "../context/GlobalContext";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import { VexContract, NearRpcUrl } from "@/app/config";
import { useRouter } from "next/navigation";
import { useTour } from "@reactour/tour";

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

  const { currentStep, isOpen } = useTour();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 14) {
      router.push("/community");
    }
  }, [currentStep, router]);

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
              <HandCoins size={20} />
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

            <div className="earn-card rewards-section">
              <RewardsDistribution />
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
              <h3 className="earn-faq-question">What are VEX Rewards?</h3>
              <p className="earn-faq-answer">
                VEX Rewards enable the community-powered nature of BetVEX.
                <br />
                With VEX Rewards you are able to share in the revenue that the
                platform generates and decide how the platform changes in the
                future.
                <br />
                70% of the revenue BetVEX generates is distributed to those who
                have activated their VEX Rewards. The other 30% is sent to the
                treasury for the community to collectively spend.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 1 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
            >
              <h3 className="earn-faq-question">
                What are the value of VEX Rewards?
              </h3>
              <p className="earn-faq-answer">
                The value of VEX Rewards are determined by the market and its
                price will fluctuate over time depending on market conditions.
                <br />
                VEX Rewards are available for trading 24/7.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 2 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
            >
              <h3 className="earn-faq-question">
                What does it mean to Activate VEX Rewards?
              </h3>
              <p className="earn-faq-answer">
                70% of the revenue BetVEX generates is distributed to those who
                have activated their VEX Rewards.
                <br />
                By activating VEX Rewards you are providing funds to financially
                back the bets placed on the platform. The more you activate the
                more you can earn and you can activate more $VEX rewards
                whenever you want.
                <br />
                In rare cases, a betting market can cause a loss meaning that
                those who have activated VEX Rewards could lose some of their
                VEX Rewards, though we expect a 5% return on each betting market
                and there is a pool of $ to reduce the risk of this happening.
              </p>
            </div>

            <div
              className={`earn-faq-item ${activeFaq === 3 ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
            >
              <h3 className="earn-faq-question">
                What happens when you deactivate your rewards?
              </h3>
              <p className="earn-faq-answer">
                If you are finished collecting rewards you can deactivate your
                VEX Rewards which will stop you from earning further rewards and
                stop any chances of losing your rewards. Please note that you
                can only deactivate your rewards 1 week after last activating
                rewards, this grace period stops people from collecting rewards
                without backing bets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarnPage;
