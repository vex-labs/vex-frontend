import React, { useState, useEffect, useMemo } from "react";
import { providers } from "near-api-js";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, VexContract } from "@/app/config";
import {
  Loader2,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { actionCreators, encodeSignedDelegate } from "@near-js/transactions";

/**
 * Enhanced Staking component
 *
 * This component allows users to stake and unstake their tokens.
 * It displays the user's balance, staked balance, and total USDC rewards.
 * Users can select between staking and unstaking options, enter an amount, and submit transactions.
 *
 * @returns {JSX.Element} The rendered Staking component
 */

const Staking = () => {
  // Get authentication contexts
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();
  const { accountId } = useGlobalContext();
  const [selectedOption, setSelectedOption] = useState("stake");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [totalUSDCRewards, setTotalUSDCRewards] = useState(null);
  const [refreshBalances, setRefreshBalances] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [unstakeTimestamp, setUnstakeTimestamp] = useState(null);
  // Add a refresh interval to periodically check if cooldown ended
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = VexContract;
  const provider = new providers.JsonRpcProvider(NearRpcUrl);

  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    setBalance(tokenBalances.VEX); // Update balance from context if tokenBalances changes
  }, [tokenBalances]);

  // Fetch staked balance and rewards on component mount or as needed
  useEffect(() => {
    console.log("fetching staked balance");
    if (accountId) {
      fetchStakedBalance(accountId);
      rewards_ready_to_swap(stakingContractId);
      fetchUserStakeInfo(accountId);
    }
  }, [accountId, refreshBalances, tokenBalances, refreshCooldown]);

  // Set up a timer to check for cooldown expiration
  useEffect(() => {
    // Refresh the cooldown status every 10 seconds
    const intervalId = setInterval(() => {
      if (unstakeTimestamp && isNearCooldownEnd()) {
        setRefreshCooldown((prev) => prev + 1);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [unstakeTimestamp]);

  // Check if we're near the end of the cooldown period
  const isNearCooldownEnd = () => {
    if (!unstakeTimestamp) return false;

    const currentTimeNano = getCurrentTimeInNanoseconds();
    const timestampNano = BigInt(unstakeTimestamp);

    // If less than 1 minute remains, or cooldown has passed
    return (
      currentTimeNano >= timestampNano ||
      timestampNano - currentTimeNano < BigInt(60 * 1000000000)
    );
  };

  // Format timestamp to readable date and time
  const formatUnstakeTime = (timestamp) => {
    if (!timestamp) return "";

    // Convert from nanoseconds to milliseconds (divide by 1,000,000)
    const milliseconds = Math.floor(Number(timestamp) / 1000000);

    const date = new Date(milliseconds);

    const dateStr = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
    });

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateStr} ${timeStr}`;
  };

  // Get current time in nanoseconds
  const getCurrentTimeInNanoseconds = () => {
    return BigInt(Date.now()) * BigInt(1000000);
  };

  // Fetch user's stake info including unstake timestamp
  const fetchUserStakeInfo = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString("base64");
      const result = await provider.query({
        request_type: "call_function",
        account_id: stakingContractId,
        method_name: "get_user_stake_info",
        args_base64: encodedArgs,
        finality: "final",
      });

      const resultString = Buffer.from(result.result).toString();
      const stakeInfo = JSON.parse(resultString);

      if (stakeInfo && stakeInfo.unstake_timestamp) {
        setUnstakeTimestamp(stakeInfo.unstake_timestamp);
      } else {
        setUnstakeTimestamp(null);
      }
    } catch (error) {
      console.error("Error fetching stake info:", error);
      setUnstakeTimestamp(null);
    }
  };

  const handlePercentageClick = (percentage) => {
    const currentBalance = selectedOption === "stake" ? balance : stakedBalance;

    if (percentage === 1) {
      setAmount(currentBalance);
      return;
    }

    setAmount((currentBalance * percentage).toFixed(2));
  };

  // Handle stepping amount up or down
  const handleAmountStep = (direction) => {
    const currentAmount = parseFloat(amount || 0);
    // Define step size based on balance to make it more useful
    const currentBalance = selectedOption === "stake" ? balance : stakedBalance;
    const stepSize = Math.max(10, Math.floor(currentBalance * 0.05)); // 5% of balance or minimum 10 VEX

    // Calculate new amount based on direction
    let newAmount = currentAmount;
    if (direction === "up") {
      newAmount = currentAmount + stepSize;
    } else if (direction === "down") {
      newAmount = Math.max(0, currentAmount - stepSize);
    }

    // Format and update the amount
    setAmount(newAmount.toFixed(2));
  };

  // This function fetches the staked balance for the user
  const fetchStakedBalance = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString("base64");
      const result = await provider.query({
        request_type: "call_function",
        account_id: stakingContractId,
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

  // This function fetches the total USDC rewards available to swap
  const rewards_ready_to_swap = async () => {
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

  // This function stakes the user's tokens in the staking contract
  const handleStake = async () => {
    if (!amount) {
      console.error("Please enter an amount to activate");
      return;
    }

    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      console.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);

    // Convert amount to a fixed number with 2 decimal places, then to BigInt format
    const formattedAmount = BigInt(
      parseFloat(parseFloat(amount).toFixed(2)) * 1e18
    ).toString();
    const msg = JSON.stringify("Stake");
    const gas = "100000000000000";

    try {
      if (parseFloat(amount) < 50) {
        console.error(
          "Minimum of 50 VEX is required to register in the contract"
        );
        setIsProcessing(false);
        return;
      }

      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);
        const action = actionCreators.functionCall(
          "ft_transfer_call",
          {
            receiver_id: stakingContractId,
            amount: formattedAmount,
            msg: msg,
          },
          gas,
          "1"
        );

        const signedDelegate = await account.signedDelegate({
          actions: [action],
          blockHeightTtl: 120,
          receiverId: tokenContractId,
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

        setActionSuccess(true);
      }
      // If using NEAR Wallet
      else if (signedAccountId && wallet) {
        const stakeResult = await wallet.callMethod({
          contractId: tokenContractId,
          method: "ft_transfer_call",
          args: {
            amount: formattedAmount,
            receiver_id: stakingContractId,
            msg: JSON.stringify("Stake"),
          },
          gas,
          deposit: "1",
        });

        if (stakeResult && !stakeResult.error) {
          setActionSuccess(true);
        } else {
          console.error("Failed to Activate. Please try again");
        }
      }
    } catch (error) {
      console.error("Error during activation process:", error);
    } finally {
      setIsProcessing(false);

      // Reset form after successful transaction
      setTimeout(() => {
        setAmount("");
        setActionSuccess(false);
        setRefreshBalances((prev) => !prev);
        toggleRefreshBalances();
        fetchUserStakeInfo(accountId);
      }, 3000);
    }
  };

  // This function unstakes the user's tokens and withdraws them from the staking contract
  const handleUnstake = async () => {
    if (!amount) {
      console.error("Please enter an amount to deactivate");
      return;
    }

    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      console.error("Please connect your wallet first");
      return;
    }

    // Double-check if unstaking is allowed before proceeding
    if (unstakeTimestamp) {
      const currentTimeNano = getCurrentTimeInNanoseconds();
      if (currentTimeNano < BigInt(unstakeTimestamp)) {
        console.error(
          "You cannot deactivate until the cooldown period has ended"
        );
        // Force refresh the stake info to get the latest timestamp
        fetchUserStakeInfo(accountId);
        return;
      }
    }

    setIsProcessing(true);

    // Convert amount to a fixed number with 2 decimal places, then to BigInt format
    const formattedAmount = BigInt(
      parseFloat(parseFloat(amount).toFixed(2)) * 1e18
    ).toString();
    const gas = "100000000000000";
    const deposit = "0";

    try {
      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);

        const action = actionCreators.functionCall(
          "unstake",
          { amount: formattedAmount },
          gas,
          deposit
        );

        const signedDelegate = await account.signedDelegate({
          actions: [action],
          blockHeightTtl: 120,
          receiverId: stakingContractId,
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
        setActionSuccess(true);
      }
      // If using NEAR Wallet
      else if (signedAccountId && wallet) {
        const unstakeResult = await wallet.callMethod({
          contractId: stakingContractId,
          method: "unstake",
          args: { amount: formattedAmount },
          gas,
          deposit,
        });

        if (unstakeResult.error) {
          console.error("Deactivation failed. Please try again");
          return;
        }

        setActionSuccess(true);
      }

      // Refresh balances and reset form
      setRefreshBalances((prev) => !prev);
      toggleRefreshBalances();
      fetchUserStakeInfo(accountId);

      // Reset form after successful transaction
      setTimeout(() => {
        setAmount("");
        setActionSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error during unstaking process:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if the user has enough balance for the action
  const insufficientBalance =
    selectedOption === "stake"
      ? Number(balance) < Number(amount)
      : Number(stakedBalance) < Number(amount);

  // Check if unstaking is currently allowed (cooldown period ended)
  const canUnstake = useMemo(() => {
    if (!unstakeTimestamp) return true;

    const currentTimeNano = getCurrentTimeInNanoseconds();
    return currentTimeNano >= BigInt(unstakeTimestamp);
  }, [unstakeTimestamp, refreshCooldown]);

  // Unstaking is disabled if it's in cooldown period or if there's insufficient balance
  const unstakeDisabled =
    !canUnstake || insufficientBalance || !amount || isProcessing;

  // Get button text for unstake button
  const getUnstakeButtonText = () => {
    if (isProcessing) {
      return (
        <span className="button-content">
          <Loader2 size={18} className="loading-icon" />
          Processing...
        </span>
      );
    }

    if (actionSuccess && selectedOption === "unstake") {
      return (
        <span className="button-content">
          <CheckCircle size={18} />
          Unstaked Successfully!
        </span>
      );
    }

    if (insufficientBalance) {
      return "Insufficient Balance";
    }

    if (selectedOption === "unstake" && !canUnstake) {
      return (
        <span className="button-content">
          <Clock size={16} className="mr-2" />
          Available {formatUnstakeTime(unstakeTimestamp)}
        </span>
      );
    }

    return "Deactivate VEX";
  };

  return (
    <div className="staking-container">
      <div className="staking-header-row">
        <div className="earn-card-header">
          <h2 className="staking-heading">
            {selectedOption === "stake" ? "Activate" : "Deactivate"} VEX Rewards
          </h2>
          <div className="earn-card-subtitle">
            Activate your VEX Rewards to earn
          </div>
        </div>
      </div>

      <div className="staking-stats-container">
        <div className="stat-card">
          <div className="stat-title">Your Balance</div>
          <div className="stat-value">
            {parseFloat(balance).toFixed(2)}{" "}
            <span className="token-unit">VEX</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Your Activated Balance</div>
          <div className="stat-value">
            {parseFloat(stakedBalance).toFixed(2)}{" "}
            <span className="token-unit">VEX</span>
          </div>
        </div>
      </div>

      <div className="action-toggle">
        <button
          className={`toggle-button ${
            selectedOption === "stake" ? "active" : ""
          }`}
          onClick={() => setSelectedOption("stake")}
        >
          Activate
        </button>
        <button
          className={`toggle-button ${
            selectedOption === "unstake" ? "active" : ""
          }`}
          onClick={() => setSelectedOption("unstake")}
        >
          Deactivate
        </button>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img
            src={"/icons/g12.svg"}
            alt={"VEX Token Logo"}
            className="token-logo"
          />
          <div>
            <p className="token-name">VEX</p>
          </div>
        </div>
        <div className="input-wrapper">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="token-input"
            disabled={isProcessing}
          />
          <div className="amount-stepper">
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("up")}
              disabled={isProcessing}
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("down")}
              disabled={isProcessing || parseFloat(amount || 0) <= 0}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="balance-row">
        <span className="balance-label">
          Balance:{" "}
          <span className="balance-amount">
            {parseFloat(
              selectedOption === "stake" ? balance : stakedBalance
            ).toFixed(2)}{" "}
            VEX
          </span>
        </span>
        <div className="percentage-options">
          <button onClick={() => handlePercentageClick(0.25)}>25%</button>
          <button onClick={() => handlePercentageClick(0.5)}>50%</button>
          <button onClick={() => handlePercentageClick(0.75)}>75%</button>
          <button onClick={() => handlePercentageClick(1)}>100%</button>
        </div>
      </div>

      <button
        className={`confirm-button last ${isProcessing ? "loading" : ""} ${
          actionSuccess &&
          (selectedOption === "stake" || selectedOption === "unstake")
            ? "success"
            : ""
        } ${selectedOption === "unstake" && !canUnstake ? "cooldown" : ""}`}
        onClick={selectedOption === "stake" ? handleStake : handleUnstake}
        disabled={
          selectedOption === "stake"
            ? isProcessing || !amount || insufficientBalance
            : unstakeDisabled
        }
      >
        {selectedOption === "stake" ? (
          isProcessing ? (
            <span className="button-content">
              <Loader2 size={18} className="loading-icon" />
              Processing...
            </span>
          ) : actionSuccess ? (
            <span className="button-content">
              <CheckCircle size={18} />
              Staked Successfully!
            </span>
          ) : insufficientBalance ? (
            "Insufficient Balance"
          ) : (
            "Activate VEX"
          )
        ) : (
          getUnstakeButtonText()
        )}
      </button>
    </div>
  );
};

export default Staking;
