import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { NearRpcUrl, VexContract } from "@/app/config";
import { Loader2, CheckCircle, CoinsIcon } from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { actionCreators, encodeSignedDelegate } from "@near-js/transactions";
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
  const [isLoading, setIsLoading] = useState(true);

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
    if (!accountId) {
      setIsLoading(false);
      setTotalUSDCRewards(0);
      return;
    }

    setIsLoading(true);
    try {
      // Call the view function `get_usdc_staking_rewards` on the contract
      const result = await provider.query({
        request_type: "call_function",
        account_id: VexContract,
        method_name: "get_usdc_staking_rewards",
        args_base64: "", // No arguments are required
        finality: "final",
      });

      console.log("result:", result);

      // Parse the response and convert to the correct format (assuming 6 decimals for USDC)
      const parsedResult = JSON.parse(Buffer.from(result.result).toString());
      const totalUSDCRewardsToSwap = parseFloat(parsedResult) / 1e6;

      console.log("parsedResult:", parsedResult);
      console.log("totalUSDCRewardsToSwap:", totalUSDCRewardsToSwap);

      // Round to 2 decimal places
      if (totalUSDCRewardsToSwap > 0) {
        setTotalUSDCRewards(parseFloat(totalUSDCRewardsToSwap.toFixed(2)));
      } else {
        setTotalUSDCRewards(0);
      }
    } catch (error) {
      console.error("Failed to retrieve USDC rewards to swap:", error);
      setTotalUSDCRewards(0);
    } finally {
      setIsLoading(false);
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
        const account = await nearConnection.account(web3authAccountId);

        const action = actionCreators.functionCall(
          "perform_stake_swap",
          {},
          gas,
          "0"
        );

        const signedDelegate = await account.signedDelegate({
          actions: [action],
          blockHeightTtl: 120,
          receiverId: contractId,
        });

        const encodedDelegate = Array.from(
          encodeSignedDelegate(signedDelegate)
        );

        // Send the signed delegate to our relay API
        const response = await fetch("/api/transactions/relay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([encodedDelegate]), // Send as array of transactions
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to relay transaction");
        }

        const { data } = await response.json();

        console.log("Relayed transaction:", data);

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
        <div className="rewards-subtitle">
          Distribute USD rewards to stakers
        </div>
      </div>

      <div className="rewards-stats-container">
        <div className="stat-card">
          <div className="stat-title">Available USD Rewards</div>
          {isLoading ? (
            <div className="loading-indicator">
              <Loader2 size={24} className="loading-icon" />
            </div>
          ) : (
            <div className="stat-value usdc-value">
              {totalUSDCRewards !== null
                ? parseFloat(totalUSDCRewards).toFixed(2)
                : "0.00"}{" "}
              <span className="token-unit">USD</span>
            </div>
          )}
        </div>
      </div>

      <button
        className={`distribute-rewards-button ${
          isDistributingRewards ? "loading" : ""
        } ${actionSuccess ? "success" : ""}`}
        onClick={handleDistributeRewards}
        disabled={
          isLoading ||
          isDistributingRewards ||
          !totalUSDCRewards ||
          totalUSDCRewards <= 0
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
    </div>
  );
};

export default RewardsDistribution;
