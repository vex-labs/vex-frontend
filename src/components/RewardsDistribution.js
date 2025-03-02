import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { NearRpcUrl, VexContract } from "@/app/config";
import { Loader2, CheckCircle, AlertCircle, CoinsIcon } from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { toast } from "sonner";

/**
 * Rewards Distribution component
 *
 * This component allows admin users to distribute USDC rewards to stakers
 * It displays the total USDC rewards available and provides a button to distribute them
 *
 * @returns {JSX.Element} The rendered Rewards Distribution component
 */
const RewardsDistribution = () => {
  const [totalUSDCRewards, setTotalUSDCRewards] = useState(null);
  const [isDistributingRewards, setIsDistributingRewards] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Get authentication contexts
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();
  const { accountId } = useGlobalContext();

  const provider = new providers.JsonRpcProvider(NearRpcUrl);
  
  // Fetch rewards data on component mount
  useEffect(() => {
    if (accountId) {
      fetchRewardsData();
    }
  }, [accountId]);

  // This function fetches the total USDC rewards available to distribute
  const fetchRewardsData = async () => {
    try {
      // Call the view function `get_usdc_staking_rewards` on the contract
      const result = await provider.query({
        request_type: "call_function",
        account_id: VexContract,
        method_name: "get_usdc_staking_rewards",
        args_base64: "", // No arguments are required
        finality: "final",
      });

      // Parse the response and convert to the correct format (assuming 6 decimals for USDC)
      const parsedResult = JSON.parse(Buffer.from(result.result).toString());
      const totalUSDCRewardsToSwap = parseFloat(parsedResult) / 1e6;

      // Round to 2 decimal places
      if (totalUSDCRewardsToSwap > 0) {
        setTotalUSDCRewards(parseFloat(totalUSDCRewardsToSwap.toFixed(2)));
      } else {
        setTotalUSDCRewards(0);
      }
    } catch (error) {
      console.error("Failed to retrieve USDC rewards to swap:", error);
      setTotalUSDCRewards(0);
    }
  };

  // This function distributes rewards to stakers
  const handleDistributeRewards = async () => {
    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsDistributingRewards(true);
    toast("Distributing rewards...");

    const contractId = VexContract;
    const gas = "300000000000000"; // 300 TGas

    try {
      // If using Web3Auth, use the relayer API
      if (web3auth?.connected) {
        // Call relayer API to distribute rewards
        const response = await fetch("/api/relayer/distribute-rewards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: web3authAccountId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Distribute rewards via relayer failed: ${errorData.error || "Unknown error"}`);
        }

        const result = await response.json();
        console.log("Distribute rewards via relayer successful:", result);

        toast.success("Rewards distributed successfully");
        setActionSuccess(true);
      }
      // If using NEAR Wallet
      else if (signedAccountId && wallet) {
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "perform_stake_swap",
          args: {},
          gas,
          deposit: "0", // Minimal deposit in yoctoNEAR
        });

        console.log("Stake swap successful!", outcome);
        toast.success("Rewards distributed successfully!");
        setActionSuccess(true);
      } else {
        toast.error("Failed to distribute rewards. Please try again.");
      }

      // Refresh rewards data
      setTimeout(() => {
        fetchRewardsData();
        setActionSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to perform stake swap:", error.message || error);
      toast.error("Failed to distribute rewards");
    } finally {
      setIsDistributingRewards(false);
    }
  };


  return (
    <div className="rewards-distribution-container">
      <div className="rewards-distribution-header">
        <h2 className="rewards-heading">Rewards Distribution</h2>
        <div className="rewards-subtitle">Distribute USDC rewards to stakers</div>
      </div>

      <div className="rewards-stats-container">
        <div className="stat-card">
          <div className="stat-title">Available USDC Rewards</div>
          <div className="stat-value usdc-value">
            {totalUSDCRewards !== null
              ? parseFloat(totalUSDCRewards).toFixed(2)
              : "0.00"}{" "}
            <span className="token-unit">USD</span>
          </div>
        </div>
      </div>


      <button
        className={`distribute-rewards-button ${
          isDistributingRewards ? "loading" : ""
        } ${actionSuccess ? "success" : ""}`}
        onClick={handleDistributeRewards}
        disabled={
          isDistributingRewards || !totalUSDCRewards || totalUSDCRewards <= 0
        }
      >
        {isDistributingRewards ? (
          <span className="button-content">
            <Loader2 size={18} className="loading-icon" />
            Distributing...
          </span>
        ) : actionSuccess ? (
          <span className="button-content">
            <CheckCircle size={18} />
            Distributed!
          </span>
        ) : (
          <span className="button-content">
            <CoinsIcon size={18} />
            Distribute Rewards
          </span>
        )}
      </button>

      <style jsx>{`
        .rewards-distribution-container {
          max-width: 700px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .rewards-distribution-header {
          margin-bottom: 24px;
          text-align: center;
        }
        
        .rewards-heading {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: white;
          text-align: center;
        }
        
        .rewards-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin-top: 4px;
          text-align: center;
        }
        
        .rewards-stats-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .stat-card {
          flex: 1;
          background: rgba(30, 30, 30, 0.7);
          padding: 20px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          max-width: 300px;
          margin: 0 auto;
        }
        
        .stat-title {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 26px;
          font-weight: 600;
          color: white;
        }
        
        .usdc-value {
          color: #2CE6FF;
        }
        
        .token-unit {
          font-size: 16px;
          opacity: 0.7;
          margin-left: 4px;
        }
        
        .message-box {
          padding: 12px 16px;
          border-radius: 8px;
          margin: 0 auto 20px;
          max-width: 400px;
          z-index: 5;
          position: relative;
        }
        
        .message-error {
          background: rgba(255, 60, 60, 0.1);
          border-left: 3px solid rgba(255, 60, 60, 0.8);
        }
        
        .message-success {
          background: rgba(43, 255, 136, 0.1);
          border-left: 3px solid rgba(43, 255, 136, 0.8);
        }
        
        .message-info {
          background: rgba(107, 151, 255, 0.1);
          border-left: 3px solid rgba(107, 151, 255, 0.8);
        }
        
        .message-content {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }
        
        .distribute-rewards-button {
          width: 300px;
          max-width: 100%;
          margin: 0 auto;
          padding: 14px;
          border-radius: 10px;
          background: linear-gradient(to right, #3DD68C, #4DA6FF);
          color: white;
          font-weight: 500;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          margin-top: 8px;
        }
        
        .distribute-rewards-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .distribute-rewards-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-icon {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .button-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        @media (max-width: 768px) {
          .rewards-distribution-container {
            padding: 20px;
          }
          
          .stat-value {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default RewardsDistribution;