import React, { useState, useEffect } from "react";
import { swapTokens } from "@/utils/swapTokens";
import { handleTransaction } from "@/utils/accountHandler";
import { useGlobalContext } from "../app/context/GlobalContext";
import { providers } from "near-api-js";
import { NearRpcUrl } from "@/app/config";
import {
  ArrowDownUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Enhanced Swap component
 *
 * This component allows users to swap between VEX and USDC tokens using refswap.
 * It displays input fields for the amounts to be swapped and handles the swap transactions.
 * Users can select the swap direction and enter the amount to be swapped.
 *
 * @param {Object} props - The component props
 * @param {string} props.signedAccountId - The signed-in user's account ID
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 * @param {Object} props.wallet - Wallet object for handling transactions
 *
 * @returns {JSX.Element} The rendered Swap component
 */

const Swap = ({ signedAccountId, isVexLogin, wallet }) => {
  const [vexAmount, setVexAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [displayUsdcAmount, setDisplayUsdcAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState(false); // true = VEX → USDC, false = USDC → VEX
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  // Use global context for token balances and refresh function
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

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
    setMessage({ text: "", type: "info" });

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
        setUsdcAmount(outputEquivalent.toFixed(6));
        setDisplayUsdcAmount(outputEquivalent.toFixed(2));
      } else {
        setVexAmount(outputEquivalent.toFixed(6));
      }
    } catch (error) {
      console.error("Failed to fetch output amount:", error);
      setMessage({
        text: "Failed to calculate exchange rate",
        type: "error",
      });
    } finally {
      setIsCalculating(false);
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

  const handleNearSwap = async () => {
    if (!wallet) {
      setMessage({ text: "Wallet is not initialized", type: "error" });
      return;
    }

    const tokenAmount = parseFloat(
      swapDirection ? vexAmount : usdcAmount || "0"
    );
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      setMessage({ text: "Invalid swap amount", type: "error" });
      return;
    }

    const formattedAmount = BigInt(
      Math.floor(tokenAmount * Math.pow(10, swapDirection ? 18 : 6))
    ).toString();

    setIsSwapping(true);
    setMessage({ text: "Processing swap...", type: "info" });

    try {
      const outcome = await swapTokens(wallet, swapDirection, formattedAmount);
      console.log("Swap outcome:", outcome);
      setSwapSuccess(true);
      setMessage({
        text: "Swap successful! Tokens have been transferred",
        type: "success",
      });
      toggleRefreshBalances(); // Trigger balance refresh after a successful transaction

      // Reset form after successful swap
      setTimeout(() => {
        setVexAmount("");
        setUsdcAmount("");
        setDisplayUsdcAmount("");
        setSwapSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Swap failed:", error.message || error);
      setMessage({
        text: `Swap failed: ${error.message || "Unknown error"}`,
        type: "error",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleVexSwap = async () => {
    if (!password) {
      setShowPasswordModal(true);
      return;
    }

    const tokenContractId = swapDirection
      ? "token.betvex.testnet"
      : "usdc.betvex.testnet";
    const receiverId = "ref-finance-101.testnet";
    const poolId = 2197;

    const tokenAmount = parseFloat(
      swapDirection ? vexAmount : usdcAmount || "0"
    );
    console.log("Input Amount for Swap:", tokenAmount);

    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      setMessage({ text: "Invalid swap amount", type: "error" });
      return;
    }

    setIsSwapping(true);
    setMessage({ text: "Processing swap...", type: "info" });

    const formattedAmount = BigInt(
      Math.floor(tokenAmount * Math.pow(10, swapDirection ? 18 : 6))
    ).toString();
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

    const gas = "100000000000000";
    const deposit = "1";

    try {
      const outcome = await handleTransaction(
        tokenContractId,
        "ft_transfer_call",
        {
          receiver_id: receiverId,
          amount: formattedAmount,
          msg: msg,
        },
        gas,
        deposit,
        wallet,
        password
      );
      console.log("Swap Successful:", outcome);
      setSwapSuccess(true);
      setMessage({
        text: "Swap successful! Tokens have been transferred",
        type: "success",
      });
      toggleRefreshBalances(); // Trigger balance refresh after successful transaction

      // Reset form after successful swap
      setTimeout(() => {
        setVexAmount("");
        setUsdcAmount("");
        setDisplayUsdcAmount("");
        setSwapSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Swap failed:", error);
      setMessage({
        text: `Swap failed: ${error.message || "Unknown error"}`,
        type: "error",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password) {
      return;
    }

    localStorage.setItem("vexPassword", password);
    setShowPasswordModal(false);
    handleVexSwap();
  };

  const handleSwap = () => {
    if (signedAccountId) {
      handleNearSwap();
    } else if (isVexLogin) {
      handleVexSwap();
    } else {
      setMessage({ text: "Please log in first", type: "warning" });
    }
  };

  const toggleSwapDirection = () => {
    setSwapDirection(!swapDirection);
    setVexAmount("");
    setUsdcAmount("");
    setDisplayUsdcAmount("");
    setMessage({ text: "", type: "info" });
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
        <h2 className="swap-heading">
          {swapDirection ? "Sell" : "Buy"} VEX Rewards
        </h2>

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
            <p className="token-name">{swapDirection ? "VEX" : "USDC"}</p>
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
            disabled={isSwapping}
          />
        </div>
      </div>

      <div className="balance-row">
        <span className="balance-label">
          Balance:{" "}
          <span className="balance-amount">
            {swapDirection ? tokenBalances.VEX : tokenBalances.USDC}
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
          disabled={isSwapping}
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
            {swapDirection ? tokenBalances.USDC : tokenBalances.VEX}
          </span>
        </span>
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
        className={`swap-button ${isSwapping ? "loading" : ""} ${
          swapSuccess ? "success" : ""
        }`}
        onClick={handleSwap}
        disabled={isSwapDisabled}
      >
        {isSwapping ? (
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

      {/* Password Modal */}
      {showPasswordModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Enter Password</h3>
              <p className="modal-description">
                Please enter your wallet password to complete the swap
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

export default Swap;
