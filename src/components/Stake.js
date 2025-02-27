import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { handleTransaction } from "@/utils/accountHandler";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, GuestbookNearContract } from "@/app/config";
import {
  ArrowDownUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CoinsIcon,
} from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Enhanced Staking component
 *
 * This component allows users to stake and unstake their tokens.
 * It displays the user's balance, staked balance, and total USDC rewards.
 * Users can select between staking and unstaking options, enter an amount, and submit transactions.
 *
 * @param {Object} props - The component props
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.signedAccountId - The signed-in user's account ID
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 *
 * @returns {JSX.Element} The rendered Staking component
 */

const Staking = ({ wallet, signedAccountId, isVexLogin }) => {
  const [selectedOption, setSelectedOption] = useState("stake");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [totalUSDCRewards, setTotalUSDCRewards] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [refreshBalances, setRefreshBalances] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDistributingRewards, setIsDistributingRewards] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = GuestbookNearContract;
  const provider = new providers.JsonRpcProvider(NearRpcUrl);

  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    setBalance(tokenBalances.VEX); // Update balance from context if tokenBalances changes
  }, [tokenBalances]);

  // Load saved password from local storage
  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  // Load saved VEX account ID from local storage
  useEffect(() => {
    if (isVexLogin) {
      const storedVexAccountId = localStorage.getItem("vexAccountId");
      if (storedVexAccountId) {
        setVexAccountId(storedVexAccountId);
      }
    }
  }, [isVexLogin]);

  // Fetch staked balance and rewards on component mount or as needed
  useEffect(() => {
    const accountId = signedAccountId || vexAccountId;

    console.log("fetching staked balance");
    if (accountId) {
      fetchStakedBalance(accountId);
      rewards_ready_to_swap(stakingContractId);
    }
  }, [signedAccountId, vexAccountId, refreshBalances]);

  const handlePercentageClick = (percentage) => {
    const currentBalance = selectedOption === "stake" ? balance : stakedBalance;
    setAmount((currentBalance * percentage).toFixed(2));
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

      setStakedBalance(isNaN(stakedBalanceRaw) ? 0 : stakedBalanceRaw);
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
        account_id: GuestbookNearContract,
        method_name: "get_usdc_staking_rewards",
        args_base64: "", // No arguments are required
        finality: "final",
      });

      // Parse the response and convert to the correct format (assuming 6 decimals for USDC)
      const parsedResult = JSON.parse(Buffer.from(result.result).toString());
      const totalUSDCRewardsToSwap = parseFloat(parsedResult) / 1e6;

      if (totalUSDCRewardsToSwap > 0) {
        setTotalUSDCRewards(totalUSDCRewardsToSwap);
      } else {
        setTotalUSDCRewards(0);
      }
    } catch (error) {
      console.error("Failed to retrieve USDC rewards to swap:", error);
      setTotalUSDCRewards(0);
    }
  };

  // Fetch rewards on component mount or as needed
  useEffect(() => {
    rewards_ready_to_swap();
  }, []);

  const handlePasswordSubmit = () => {
    if (!password) {
      return;
    }

    localStorage.setItem("vexPassword", password);
    setShowPasswordModal(false);

    // Trigger function based on selected option
    if (selectedOption === "stake") {
      handleStake();
    } else if (selectedOption === "unstake") {
      handleUnstake();
    } else if (selectedOption === "stakeSwap") {
      handleStakeSwap();
    }
  };

  // This function stakes the user's tokens in the staking contract
  const handleStake = async () => {
    if (!amount) {
      setMessage({ text: "Please enter an amount to stake", type: "warning" });
      return;
    }

    if (isVexLogin && !password) {
      setShowPasswordModal(true);
      return;
    }

    setIsProcessing(true);
    setMessage({ text: "Processing stake transaction...", type: "info" });

    const formattedAmount = BigInt(parseFloat(amount) * 1e18).toString();
    const msg = JSON.stringify("Stake");
    const gas = "100000000000000";
    const deposit = "0";
    const deposit1 = "1";

    try {
      if (parseFloat(amount) < 50) {
        setMessage({
          text: "Minimum of 50 VEX is required to register in the contract",
          type: "error",
        });
        setIsProcessing(false);
        return;
      }

      if (isVexLogin) {
        const depositResult = await handleTransaction(
          tokenContractId,
          "ft_transfer_call",
          { receiver_id: stakingContractId, amount: formattedAmount, msg },
          gas,
          deposit1,
          null,
          password
        );

        if (depositResult && !depositResult.error) {
          setMessage({
            text: "Deposit successful. Proceeding to stake...",
            type: "info",
          });

          const stakeResult = await handleTransaction(
            stakingContractId,
            "stake",
            { amount: formattedAmount },
            gas,
            deposit,
            null,
            password
          );

          if (stakeResult && !stakeResult.error) {
            setMessage({
              text: "Stake transaction successful",
              type: "success",
            });
            setActionSuccess(true);
          } else {
            setMessage({
              text: "Failed to stake. Please try again",
              type: "error",
            });
          }
        } else {
          setMessage({
            text: "Failed to deposit. Please try again",
            type: "error",
          });
        }
      } else {
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
      setMessage({
        text: "Please enter an amount to unstake",
        type: "warning",
      });
      return;
    }

    if (isVexLogin && !password) {
      setShowPasswordModal(true);
      return;
    }

    setIsProcessing(true);
    setMessage({ text: "Processing unstake transaction...", type: "info" });

    const formattedAmount = BigInt(parseFloat(amount) * 1e18).toString();
    const gas = "100000000000000";
    const deposit = "0";

    try {
      if (isVexLogin) {
        const unstakeResult = await handleTransaction(
          stakingContractId,
          "unstake",
          { amount: formattedAmount },
          gas,
          deposit,
          null,
          password
        );

        if (unstakeResult && !unstakeResult.error) {
          setMessage({
            text: "Unstake successful. Proceeding to withdraw...",
            type: "info",
          });

          const withdrawResult = await handleTransaction(
            stakingContractId,
            "withdraw_all",
            {},
            gas,
            deposit,
            null,
            password
          );

          if (withdrawResult && !withdrawResult.error) {
            setMessage({
              text: "Withdraw transaction successful",
              type: "success",
            });
            setActionSuccess(true);
            setRefreshBalances((prev) => !prev);
            toggleRefreshBalances();

            // Reset form after successful transaction
            setTimeout(() => {
              setAmount("");
              setActionSuccess(false);
            }, 3000);
          } else {
            setMessage({
              text: "Withdraw transaction failed. Please try again",
              type: "error",
            });
          }
        } else {
          setMessage({
            text: "Failed to unstake. Please try again",
            type: "error",
          });
        }
      } else {
        console.log("unstaking with wallet");
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
        // Reset form after successful unstake
        setTimeout(() => {
          setAmount("");
          setActionSuccess(false);
          setActionSuccess(true);
          setRefreshBalances((prev) => !prev);
          toggleRefreshBalances();
        }, 3000);
      }
    } catch (error) {
      setMessage({
        text: `An error occurred: ${error.message || "Please try again"}`,
        type: "error",
      });
      console.error("Error during unstaking process:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // This functions swaps the rewards from the staking contract to USDC and distributes them to the users
  const handleStakeSwap = async () => {
    if (isVexLogin && !password) {
      setSelectedOption("stakeSwap");
      setShowPasswordModal(true);
      return;
    }

    setIsDistributingRewards(true);
    setMessage({ text: "Distributing rewards...", type: "info" });

    const contractId = GuestbookNearContract;
    const gas = "300000000000000"; // 300 TGas

    try {
      if (isVexLogin) {
        const outcome = await handleTransaction(
          contractId,
          "perform_stake_swap",
          {}, // No arguments required
          gas,
          "0", // Minimal deposit in yoctoNEAR
          null,
          password
        );

        console.log("Stake swap successful!", outcome);
        setMessage({
          text: "Rewards distributed successfully",
          type: "success",
        });
        setActionSuccess(true);

        // Refresh rewards data
        setTimeout(() => {
          rewards_ready_to_swap();
          setActionSuccess(false);
        }, 3000);
      } else if (wallet && wallet.selector) {
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "perform_stake_swap",
          args: {},
          gas,
          deposit: "1", // Minimal deposit in yoctoNEAR
        });

        console.log("Stake swap successful!", outcome);
        setMessage({
          text: "Rewards distributed successfully!",
          type: "success",
        });
        setActionSuccess(true);

        // Refresh rewards data
        setTimeout(() => {
          rewards_ready_to_swap();
          setActionSuccess(false);
        }, 3000);
      } else {
        setMessage({
          text: "Failed to distribute rewards. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to perform stake swap:", error.message || error);
      setMessage({ text: "Failed to distribute rewards", type: "error" });
    } finally {
      setIsDistributingRewards(false);
    }
  };

  // Get message styling based on message type
  const getMessageClass = () => {
    switch (message.type) {
      case "error":
        return "message-error";
      case "warning":
        return "message-warning";
      case "success":
        return "message-success";
      default:
        return "message-info";
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
        <h2 className="staking-heading">
          {selectedOption === "stake" ? "Activate" : "Deactivate"} VEX Rewards
        </h2>

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
            {balance} <span className="token-unit">VEX</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Your Activated Balance</div>
          <div className="stat-value">
            {stakedBalance} <span className="token-unit">VEX</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">USD Rewards Available</div>
          <div className="stat-value usdc-value">
            {totalUSDCRewards !== null ? totalUSDCRewards : "0.00"}{" "}
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
        </div>
      </div>

      <div className="balance-row">
        <span className="balance-label">
          Balance:{" "}
          <span className="balance-amount">
            {selectedOption === "stake" ? balance : stakedBalance} VEX
          </span>
        </span>
        <div className="percentage-options">
          <button onClick={() => handlePercentageClick(0.25)}>25%</button>
          <button onClick={() => handlePercentageClick(0.5)}>50%</button>
          <button onClick={() => handlePercentageClick(0.75)}>75%</button>
          <button onClick={() => handlePercentageClick(1)}>100%</button>
        </div>
      </div>

      {(message.text || insufficientBalance) && (
        <div className={`message-box ${getMessageClass()}`}>
          <div className="message-content">
            <span className="message-icon">
              {message.type === "error" || insufficientBalance ? (
                <AlertCircle size={16} />
              ) : null}
              {message.type === "success" ? <CheckCircle size={16} /> : null}
              {message.type === "info" && !insufficientBalance ? (
                <DollarSign size={16} />
              ) : null}
            </span>
            <span>
              {message.text ||
                (insufficientBalance ? "Insufficient balance" : "")}
            </span>
          </div>
        </div>
      )}

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

      {/* Password Modal */}
      {showPasswordModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Enter Password</h3>
              <p className="modal-description">
                Please enter your wallet password to complete this transaction
              </p>
              <input
                type="password"
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your wallet password"
                className="password-input"
              />
              <div className="modal-buttons">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="cancel-modal-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="submit-modal-button"
                  disabled={!password}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Staking;
