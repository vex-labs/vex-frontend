import React, { useState } from "react";
import { swapTokens } from "@/utils/swapTokens";
import { useGlobalContext } from "../app/context/GlobalContext";
import { providers } from "near-api-js";
import { NearRpcUrl } from "@/app/config";
import { Loader2, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { toast } from "sonner";
import { actionCreators, encodeSignedDelegate } from "@near-js/transactions";

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
  const [swapDirection, setSwapDirection] = useState(false); // true = VEX → USDC (selling), false = USDC → VEX (buying)
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);

  // Use global context for token balances and refresh function
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  const getOutputAmount = async (inputAmount) => {
    if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
      setDisplayUsdcAmount("");
      return;
    }

    setIsCalculating(true);

    try {
      const provider = new providers.JsonRpcProvider(NearRpcUrl);
      const contractId = "ref-finance-101.testnet";
      const poolId = 2197;

      // For both buying and selling, we're always converting VEX amount to USDC
      const amountInYocto = BigInt(
        Math.floor(parseFloat(inputAmount) * Math.pow(10, 18))
      ).toString();

      const args = {
        pool_id: poolId,
        token_in: "token.betvex.testnet", // Always inputting VEX
        amount_in: amountInYocto,
        token_out: "usdc.betvex.testnet", // Always getting USDC equivalent
      };

      const result = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_return",
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "final",
      });

      const decodedResult = JSON.parse(Buffer.from(result.result).toString());
      // Convert from USDC's 6 decimals
      const outputUsdcAmount = decodedResult / Math.pow(10, 6);

      // Set the USDC amount to display
      setDisplayUsdcAmount(outputUsdcAmount.toFixed(2));

      // Also update usdcAmount for the swap functionality
      setUsdcAmount(outputUsdcAmount.toFixed(2));
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

    const sourceTokenId = swapDirection
      ? "token.betvex.testnet" // Selling VEX
      : "usdc.betvex.testnet"; // Buying VEX with USDC

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
    await getOutputAmount(newAmount);
  };

  // Step amount handlers for up/down steppers
  const handleAmountStep = async (direction, isVex) => {
    const currentAmount = parseFloat(vexAmount || 0);

    // Define step size
    const stepSize = 10;

    // Calculate new amount based on direction
    let newAmount = currentAmount;
    if (direction === "up") {
      newAmount = currentAmount + stepSize;
    } else if (direction === "down") {
      newAmount = Math.max(0, currentAmount - stepSize);
    }

    // Format and update the amount
    newAmount = newAmount.toFixed(2);
    setVexAmount(newAmount);
    await getOutputAmount(newAmount);
  };

  const handleSwap = async () => {
    // Check if user is logged in with either web3auth or NEAR wallet
    if (!web3auth?.connected && !signedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Always use vexAmount for input
    const tokenAmount = parseFloat(vexAmount || "0");
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      toast.error("Invalid swap amount");
      return;
    }

    const sourceTokenId = swapDirection
      ? "token.betvex.testnet" // Selling VEX
      : "usdc.betvex.testnet"; // Buying VEX with USDC
    const targetTokenId = swapDirection
      ? "usdc.betvex.testnet" // Getting USDC when selling
      : "token.betvex.testnet"; // Getting VEX when buying

    // Ensure all necessary token registrations are complete using the new API
    const registrationsComplete = await ensureTokenRegistrations(targetTokenId);

    if (!registrationsComplete) {
      return;
    }

    setIsSwapping(true);

    // Format the amount based on whether we're selling VEX or buying with USDC
    const formattedAmount = swapDirection
      ? BigInt(Math.floor(tokenAmount * Math.pow(10, 18))).toString() // Selling VEX amount
      : BigInt(Math.floor(parseFloat(usdcAmount) * Math.pow(10, 6))).toString(); // USDC amount to spend

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

        const action = actionCreators.functionCall(
          "ft_transfer_call",
          {
            receiver_id: receiverId,
            amount: formattedAmount,
            msg: msg,
          },
          "100000000000000",
          "1"
        );

        const signedDelegate = await account.signedDelegate({
          actions: [action],
          blockHeightTtl: 120,
          receiverId: sourceTokenId,
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

        setTimeout(() => {
          setVexAmount("");
          setUsdcAmount("");
          setDisplayUsdcAmount("");

          toggleRefreshBalances();
        }, 3000);
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

        toggleRefreshBalances();
      }, 3000);
    } catch (error) {
      console.error("Swap failed:", error.message || error);
      toast.error(`Error: ${error.message || "Unknown error"}`);
    } finally {
      setIsSwapping(false);
      toggleRefreshBalances();
    }
  };

  const handleAmountClick = (amount) => {
    setVexAmount(amount.toString());
    getOutputAmount(amount.toString());
  };

  // Check if the user has enough balance for the swap
  const insufficientBalance = swapDirection
    ? Number(tokenBalances.VEX) < Number(vexAmount) // For selling, check VEX balance
    : Number(tokenBalances.USDC) < Number(usdcAmount); // For buying, check USDC balance

  // Check if amounts are valid for the swap button to be enabled
  const isSwapDisabled =
    isSwapping ||
    isCalculating ||
    isCheckingRegistration ||
    insufficientBalance ||
    !Number(vexAmount);

  return (
    <div className="swap-container">
      <div className="swap-header">
        <div className="earn-card-header">
          <h2 className="swap-heading">{swapDirection ? "Sell" : "Buy"} VEX</h2>
          <div className="earn-card-subtitle">
            {swapDirection
              ? "Enter the amount of VEX you want to sell"
              : "Enter the amount of VEX you want to buy"}
          </div>
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
            src="/icons/g12.svg"
            alt="VEX Token Logo"
            className="token-logo"
          />
          <div>
            <p className="token-name">VEX</p>
          </div>
        </div>
        <div className="input-wrapper">
          <input
            type="number"
            placeholder="0.00"
            value={vexAmount}
            onChange={handleVexAmountChange}
            className="token-input"
            disabled={isSwapping || isCheckingRegistration}
          />
          <div className="amount-stepper">
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("up", true)}
              disabled={isSwapping || isCheckingRegistration}
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="stepper-btn"
              onClick={() => handleAmountStep("down", true)}
              disabled={
                isSwapping ||
                isCheckingRegistration ||
                parseFloat(vexAmount || 0) <= 0
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
            {parseFloat(tokenBalances.VEX).toFixed(2)}
          </span>
        </span>
        <div className="percentage-options">
          <button onClick={() => handleAmountClick(50)}>50</button>
          <button onClick={() => handleAmountClick(250)}>250</button>
          <button onClick={() => handleAmountClick(1000)}>1000</button>
          <button onClick={() => handleAmountClick(2500)}>2500</button>
        </div>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img
            src="/icons/usdc-logo.svg"
            alt="USDC Token Logo"
            className="token-logo"
          />
          <div>
            <p className="token-name">USDC</p>
          </div>
        </div>

        <div className="input-wrapper estimated">
          <span className="currency-symbol">$</span>
          <input
            type="text"
            placeholder="0.00"
            value={displayUsdcAmount}
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
            {parseFloat(tokenBalances.USDC).toFixed(2)}
          </span>
        </span>
      </div>

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
            {swapDirection ? "Sold" : "Purchased"} Successfully!
          </span>
        ) : insufficientBalance ? (
          "Insufficient Balance"
        ) : swapDirection ? (
          "Sell VEX"
        ) : (
          "Buy VEX"
        )}
      </button>
    </div>
  );
};

export default Swap;
