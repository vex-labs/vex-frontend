import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, VexContract } from "@/app/config";
import {
  Loader2,
  CheckCircle,
  CoinsIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { toast } from "sonner";

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
  const [isDistributingRewards, setIsDistributingRewards] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

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
    }
  }, [accountId, refreshBalances, tokenBalances]);

  const handlePercentageClick = (percentage) => {
    const currentBalance = selectedOption === "stake" ? balance : stakedBalance;
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
      toast.warning("Please enter an amount to stake");
      return;
    }

    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    toast("Processing stake transaction...");

    // Convert amount to a fixed number with 2 decimal places, then to BigInt format
    const formattedAmount = BigInt(
      parseFloat(parseFloat(amount).toFixed(2)) * 1e18
    ).toString();
    const msg = JSON.stringify("Stake");
    const gas = "100000000000000";
    const deposit = "0";
    const deposit1 = "1";

    try {
      if (parseFloat(amount) < 50) {
        toast.error(
          "Minimum of 50 VEX is required to register in the contract"
        );
        setIsProcessing(false);
        return;
      }

      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);

        // First transfer the tokens to the staking contract
        await account.functionCall({
          contractId: tokenContractId,
          methodName: "ft_transfer_call",
          args: {
            receiver_id: stakingContractId,
            amount: formattedAmount,
            msg: msg,
          },
          gas,
          attachedDeposit: deposit1,
        });

        setMessage({
          text: "Stake transaction successful",
          type: "success",
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
          setMessage({ text: "Stake successful!", type: "success" });
          setActionSuccess(true);
        } else {
          setMessage({
            text: "Failed to stake. Please try again",
            type: "error",
          });
        }
      }
    } catch (error) {
      setMessage({
        text: `An error occurred: ${error.message || "Please try again"}`,
        type: "error",
      });
      console.error("Error during deposit and stake process:", error);
    } finally {
      setIsProcessing(false);

      // Reset form after successful transaction
      setTimeout(() => {
        setAmount("");
        setActionSuccess(false);
        setRefreshBalances((prev) => !prev);
        toggleRefreshBalances();
      }, 3000);
    }
  };

  // This function unstakes the user's tokens and withdraws them from the staking contract
  const handleUnstake = async () => {
    if (!amount) {
      toast.warning("Please enter an amount to unstake");
      return;
    }

    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    toast("Processing unstake transaction...");

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

        // First unstake tokens
        await account.functionCall({
          contractId: stakingContractId,
          methodName: "unstake",
          args: { amount: formattedAmount },
          gas,
          attachedDeposit: deposit,
        });

        setMessage({
          text: "Withdraw transaction successful",
          type: "success",
        });
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
          setMessage({
            text: "Unstake failed. Please try again",
            type: "error",
          });
          return;
        }

        setMessage({
          text: "Unstake successful.",
          type: "info",
        });
        setActionSuccess(true);
      }

      // Refresh balances and reset form
      setRefreshBalances((prev) => !prev);
      toggleRefreshBalances();

      // Reset form after successful transaction
      setTimeout(() => {
        setAmount("");
        setActionSuccess(false);
      }, 3000);
    } catch (error) {
      toast.error(`An error occurred: ${error.message || "Please try again"}`);
      console.error("Error during unstaking process:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // This functions swaps the rewards from the staking contract to USDC and distributes them to the users
  const handleStakeSwap = async () => {
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
      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);

        await account.functionCall({
          contractId: contractId,
          methodName: "perform_stake_swap",
          args: {}, // No arguments required
          gas,
          attachedDeposit: "0", // Minimal deposit in yoctoNEAR
        });

        console.log("Stake swap successful!");
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
        setMessage({
          text: "Rewards distributed successfully!",
          type: "success",
        });
        setActionSuccess(true);
      } else {
        setMessage({
          text: "Failed to distribute rewards. Please try again.",
          type: "error",
        });
      }

      // Refresh rewards data
      setTimeout(() => {
        rewards_ready_to_swap();
        setActionSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to perform stake swap:", error.message || error);
      toast.error("Failed to distribute rewards");
    } finally {
      setIsDistributingRewards(false);
    }
  };

  // Check if the user has enough balance for the action
  const insufficientBalance =
    selectedOption === "stake"
      ? Number(balance) < Number(amount)
      : Number(stakedBalance) < Number(amount);

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

        <button
          className={`distribute-rewards-button ${
            isDistributingRewards ? "loading" : ""
          } ${
            actionSuccess && selectedOption === "stakeSwap" ? "success" : ""
          }`}
          onClick={handleStakeSwap}
          disabled={
            isDistributingRewards || !totalUSDCRewards || totalUSDCRewards <= 0
          }
        >
          {isDistributingRewards ? (
            <span className="button-content">
              <Loader2 size={18} className="loading-icon" />
              Distributing...
            </span>
          ) : actionSuccess && selectedOption === "stakeSwap" ? (
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

        <div className="stat-card">
          <div className="stat-title">USD Rewards Available</div>
          <div className="stat-value usdc-value">
            {totalUSDCRewards !== null
              ? parseFloat(totalUSDCRewards).toFixed(2)
              : "0.00"}{" "}
            <span className="token-unit">USD</span>
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

      {insufficientBalance && toast.error("Insufficient balance")}

      <button
        className={`confirm-button last ${isProcessing ? "loading" : ""} ${
          actionSuccess &&
          (selectedOption === "stake" || selectedOption === "unstake")
            ? "success"
            : ""
        }`}
        onClick={selectedOption === "stake" ? handleStake : handleUnstake}
        disabled={isProcessing || !amount || insufficientBalance}
      >
        {isProcessing ? (
          <span className="button-content">
            <Loader2 size={18} className="loading-icon" />
            Processing...
          </span>
        ) : actionSuccess &&
          (selectedOption === "stake" || selectedOption === "unstake") ? (
          <span className="button-content">
            <CheckCircle size={18} />
            {selectedOption === "stake"
              ? "Staked Successfully!"
              : "Unstaked Successfully!"}
          </span>
        ) : insufficientBalance ? (
          "Insufficient Balance"
        ) : (
          `${selectedOption === "stake" ? "Activate" : "Deactivate"} VEX`
        )}
      </button>
    </div>
  );
};

export default Staking;
