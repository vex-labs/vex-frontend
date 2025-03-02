import React, { useState } from "react";
import { swapTokens } from "@/utils/swapTokens";
import { useGlobalContext } from "../app/context/GlobalContext";
import { providers } from "near-api-js";
import { NearRpcUrl } from "@/app/config";
import {
  ArrowDownUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { toast } from "sonner";

/**
 * Enhanced Swap component with token registration support
 *
 * This component allows users to swap between VEX and USDC tokens using refswap.
 * It automatically checks and handles token registration for both sender and receiver.
 *
 * @returns {JSX.Element} The rendered Swap component
 */

const Swap = () => {
  // Get authentication contexts
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();
  const { accountId } = useGlobalContext();
  const [vexAmount, setVexAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [displayUsdcAmount, setDisplayUsdcAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState(false); // true = VEX → USDC, false = USDC → VEX
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);

  // Use global context for token balances and refresh function
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  const handlePercentageClick = async (percentage) => {
    const balance = swapDirection ? tokenBalances.VEX : tokenBalances.USDC;
    const newAmount = (balance * percentage).toFixed(2);

    if (swapDirection) {
      setVexAmount(newAmount);
      await getOutputAmount(newAmount); // Calculate USDC equivalent
    } else {
      setUsdcAmount(newAmount);
      await getOutputAmount(newAmount); // Calculate VEX equivalent
    }
  };

  const getOutputAmount = async (inputAmount) => {
    if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
      if (swapDirection) {
        setUsdcAmount("");
        setDisplayUsdcAmount("");
      } else {
        setVexAmount("");
      }
      return;
    }

    setIsCalculating(true);

    try {
      const provider = new providers.JsonRpcProvider(NearRpcUrl);
      const contractId = "ref-finance-101.testnet";
      const poolId = 2197;

      const amountInYocto = BigInt(
        Math.floor(
          parseFloat(inputAmount) * Math.pow(10, swapDirection ? 18 : 6)
        )
      ).toString();

      const args = {
        pool_id: poolId,
        token_in: swapDirection
          ? "token.betvex.testnet"
          : "usdc.betvex.testnet",
        amount_in: amountInYocto,
        token_out: swapDirection
          ? "usdc.betvex.testnet"
          : "token.betvex.testnet",
      };

      const result = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_return",
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "final",
      });

      const decodedResult = JSON.parse(Buffer.from(result.result).toString());
      const outputEquivalent =
        decodedResult / Math.pow(10, swapDirection ? 6 : 18);

      if (swapDirection) {
        setUsdcAmount(outputEquivalent.toFixed(2));
        setDisplayUsdcAmount(outputEquivalent.toFixed(2));
      } else {
        setVexAmount(outputEquivalent.toFixed(2));
      }
    } catch (error) {
      console.error("Failed to fetch output amount:", error);
      toast.error("Failed to calculate exchange rate");
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Ensures that necessary accounts are registered with token contracts before swap
   * Now using the new API endpoint
   *
   * @param {string} targetTokenId - The target token contract ID
   * @returns {Promise<boolean>} True if all necessary registrations are complete
   */
  const ensureTokenRegistrations = async (targetTokenId) => {
    setIsCheckingRegistration(true);

    try {
      const userId = accountId; // Use the unified accountId from GlobalContext
      const refSwapId = "ref-finance-101.testnet";

      // Check and register user for target token
      const targetResponse = await fetch("/api/auth/register-if-needed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: userId,
          tokenContract: targetTokenId,
        }),
      });

      if (!targetResponse.ok) {
        const errorData = await targetResponse.json();
        throw new Error(
          `Failed to register with target token: ${errorData.message}`
        );
      }

      if (wallet && !web3auth?.connected) {
        // Check and register RefSwap for source token
        const refSwapResponse = await fetch("/api/auth/register-if-needed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: refSwapId,
            tokenContract: sourceTokenId,
          }),
        });

        if (!refSwapResponse.ok) {
          const errorData = await refSwapResponse.json();
          throw new Error(`Failed to register RefSwap: ${errorData.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(`Registration failed: ${error.message}`);
      return false;
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const handleVexAmountChange = async (e) => {
    const newAmount = e.target.value;
    if (newAmount === "" || isNaN(newAmount)) {
      setVexAmount("");
      setDisplayUsdcAmount("");
      return;
    }

    setVexAmount(newAmount);
    if (swapDirection) {
      await getOutputAmount(newAmount);
    }
  };

  const handleUsdcAmountChange = async (e) => {
    const newAmount = e.target.value;
    if (newAmount === "" || isNaN(newAmount)) {
      setUsdcAmount("");
      setVexAmount("");
      return;
    }

    setUsdcAmount(newAmount);
    if (!swapDirection) {
      await getOutputAmount(newAmount);
    }
  };

  // Step amount handlers for up/down steppers
  const handleAmountStep = async (direction, isVex) => {
    const currentAmount = isVex
      ? parseFloat(vexAmount || 0)
      : parseFloat(usdcAmount || 0);

    // Define step size (smaller for USDC, larger for VEX)
    const stepSize = isVex ? 10 : 1;

    // Calculate new amount based on direction
    let newAmount = currentAmount;
    if (direction === "up") {
      newAmount = currentAmount + stepSize;
    } else if (direction === "down") {
      newAmount = Math.max(0, currentAmount - stepSize);
    }

    // Format and update the amount
    newAmount = newAmount.toFixed(2);

    if (isVex) {
      setVexAmount(newAmount);
      if (swapDirection) {
        await getOutputAmount(newAmount);
      }
    } else {
      setUsdcAmount(newAmount);
      if (!swapDirection) {
        await getOutputAmount(newAmount);
      }
    }
  };

  const handleSwap = async () => {
    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    const tokenAmount = parseFloat(
      swapDirection ? vexAmount : usdcAmount || "0"
    );
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      toast.error("Invalid swap amount");
      return;
    }

    const sourceTokenId = swapDirection
      ? "token.betvex.testnet"
      : "usdc.betvex.testnet";
    const targetTokenId = swapDirection
      ? "usdc.betvex.testnet"
      : "token.betvex.testnet";

    // Ensure all necessary token registrations are complete using the new API
    const registrationsComplete = await ensureTokenRegistrations(targetTokenId);

    if (!registrationsComplete) {
      return;
    }

    setIsSwapping(true);

    const formattedAmount = BigInt(
      Math.floor(tokenAmount * Math.pow(10, swapDirection ? 18 : 6))
    ).toString();

    try {
      // If using Web3Auth
      if (web3auth?.connected) {
        const receiverId = "ref-finance-101.testnet";
        const poolId = 2197;
        const minAmountOut = (
          parseFloat(swapDirection ? usdcAmount : vexAmount) * 0.95
        ).toFixed(6);

        const msg = JSON.stringify({
          force: 0,
          actions: [
            {
              pool_id: poolId,
              token_in: swapDirection
                ? "token.betvex.testnet"
                : "usdc.betvex.testnet",
              token_out: swapDirection
                ? "usdc.betvex.testnet"
                : "token.betvex.testnet",
              amount_in: formattedAmount,
              amount_out: "0",
              min_amount_out: BigInt(
                Math.floor(minAmountOut * Math.pow(10, swapDirection ? 6 : 18))
              ).toString(),
            },
          ],
        });

        const account = await nearConnection.account(web3authAccountId);
        await account.functionCall({
          contractId: sourceTokenId,
          methodName: "ft_transfer_call",
          args: {
            receiver_id: receiverId,
            amount: formattedAmount,
            msg: msg,
          },
          gas: "100000000000000",
          attachedDeposit: "1",
        });
      }
      // If using NEAR Wallet
      else if (signedAccountId && wallet) {
        await swapTokens(wallet, swapDirection, formattedAmount);
      }

      setSwapSuccess(true);
      toast.success("Swap successful!");

      // Reset form after successful swap
      setTimeout(() => {
        setVexAmount("");
        setUsdcAmount("");
        setDisplayUsdcAmount("");
        setSwapSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Swap failed:", error.message || error);
      toast.error(`Error: ${error.message || "Unknown error"}`);
    } finally {
      setIsSwapping(false);
      toggleRefreshBalances();
    }
  };

  const toggleSwapDirection = () => {
    setSwapDirection(!swapDirection);
    setVexAmount("");
    setUsdcAmount("");
    setDisplayUsdcAmount("");
  };

  const handleAmountClick = (amount) => {
    if (swapDirection) {
      setVexAmount(amount.toString());
      getOutputAmount(amount.toString());
    } else {
      setUsdcAmount(amount.toString());
      getOutputAmount(amount.toString());
    }
  };

  // Check if the user has enough balance for the swap
  const insufficientBalance = swapDirection
    ? Number(tokenBalances.VEX) < Number(vexAmount)
    : Number(tokenBalances.USDC) < Number(usdcAmount);

  // Check if amounts are valid for the swap button to be enabled
  const isSwapDisabled =
    isSwapping ||
    isCalculating ||
    isCheckingRegistration ||
    insufficientBalance ||
    (swapDirection ? !Number(vexAmount) : !Number(usdcAmount));

  // Get message class for styling
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

  return (
    <div className="swap-container">
      <div className="swap-header">
        <div className="earn-card-header">
          <h2 className="swap-heading">
            {swapDirection ? "Sell" : "Buy"} VEX Rewards
          </h2>
          <div className="earn-card-subtitle">Buy and sell VEX Rewards</div>
        </div>

        <div className="swap-toggle">
          <button
            className={`toggle-button ${!swapDirection ? "active" : ""}`}
            onClick={() => setSwapDirection(false)}
          >
            Buy
          </button>
          <button
            className={`toggle-button ${swapDirection ? "active" : ""}`}
            onClick={() => setSwapDirection(true)}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img
            src={swapDirection ? "/icons/g12.svg" : "/icons/usdc-logo.svg"}
            alt={swapDirection ? "VEX Token Logo" : "USDC Token Logo"}
            className="token-logo"
          />
          <div>
            <p className="token-name">{swapDirection ? "VEX" : "USD"}</p>
          </div>
        </div>
        <div className="input-wrapper">
          {swapDirection ? null : <span className="currency-symbol">$</span>}
          <input
            type="number"
            placeholder="0.00"
            value={swapDirection ? vexAmount : usdcAmount}
            onChange={
              swapDirection ? handleVexAmountChange : handleUsdcAmountChange
            }
            className="token-input"
            disabled={isSwapping || isCheckingRegistration}
          />
          <div className="amount-stepper">
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("up", swapDirection)}
              disabled={isSwapping || isCheckingRegistration}
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("down", swapDirection)}
              disabled={
                isSwapping ||
                isCheckingRegistration ||
                (swapDirection
                  ? parseFloat(vexAmount || 0) <= 0
                  : parseFloat(usdcAmount || 0) <= 0)
              }
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
              swapDirection ? tokenBalances.VEX : tokenBalances.USDC
            ).toFixed(2)}
          </span>
        </span>
        <div className="percentage-options">
          <button onClick={() => handlePercentageClick(0.25)}>25%</button>
          <button onClick={() => handlePercentageClick(0.5)}>50%</button>
          <button onClick={() => handlePercentageClick(0.75)}>75%</button>
          <button onClick={() => handlePercentageClick(1)}>100%</button>
        </div>
      </div>

      <div className="swap-arrow-container">
        <button
          className="swap-direction-button"
          onClick={toggleSwapDirection}
          disabled={isSwapping || isCheckingRegistration}
        >
          <ArrowDownUp size={20} />
        </button>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img
            src={swapDirection ? "/icons/usdc-logo.svg" : "/icons/g12.svg"}
            alt={swapDirection ? "USDC Token Logo" : "VEX Token Logo"}
            className="token-logo"
          />
          <div>
            <p className="token-name">{swapDirection ? "USDC" : "VEX"}</p>
          </div>
        </div>

        <div className="input-wrapper estimated">
          {!swapDirection ? null : <span className="currency-symbol">$</span>}
          <input
            type="text"
            placeholder="0.00"
            value={swapDirection ? displayUsdcAmount : vexAmount}
            readOnly
            className="token-input"
          />
          {isCalculating && (
            <div className="calculating-spinner">
              <Loader2 size={16} />
            </div>
          )}
        </div>
      </div>

      <div className="balance-row">
        <span className="balance-label">
          Balance:{" "}
          <span className="balance-amount">
            {parseFloat(
              swapDirection ? tokenBalances.USDC : tokenBalances.VEX
            ).toFixed(2)}
          </span>
        </span>
      </div>

      {insufficientBalance && toast.error("Insufficient balance")}

      <button
        className={`swap-button ${
          isSwapping || isCheckingRegistration ? "loading" : ""
        } ${swapSuccess ? "success" : ""}`}
        onClick={handleSwap}
        disabled={isSwapDisabled}
      >
        {isSwapping || isCheckingRegistration ? (
          <span className="button-content">
            <Loader2 size={18} className="loading-icon" />
            Processing...
          </span>
        ) : swapSuccess ? (
          <span className="button-content">
            <CheckCircle size={18} />
            Swap Successful!
          </span>
        ) : insufficientBalance ? (
          "Insufficient Balance"
        ) : (
          "Swap Tokens"
        )}
      </button>
    </div>
  );
};

export default Swap;
