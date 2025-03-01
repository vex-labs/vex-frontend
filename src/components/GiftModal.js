import * as React from "react";
import { Dialog } from "radix-ui";
import "./GiftModal.css";
import {
  Gift,
  ArrowRight,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Search,
  Loader,
} from "lucide-react";
import { NearRpcUrl, QueryURL } from "@/app/config";
import { gql, request } from "graphql-request";
import { providers } from "near-api-js";
import { useNear } from "@/app/context/NearContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useGlobalContext } from "@/app/context/GlobalContext";

const GiftModal = ({ open, setIsOpen }) => {
  const [amount, setAmount] = React.useState(1.0);
  const [giftType, setGiftType] = React.useState("usdc");
  const [username, setUsername] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = React.useState(false);
  const [accountStatus, setAccountStatus] = React.useState(null);
  const [accountType, setAccountType] = React.useState(null);
  const [isCheckingRegistration, setIsCheckingRegistration] =
    React.useState(false);

  // Get access to wallet and context
  const { wallet } = useNear();
  const {
    nearConnection,
    web3auth,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { accountId, toggleRefreshBalances } = useGlobalContext();

  // Constants
  const STORAGE_DEPOSIT_AMOUNT = "1250000000000000000000"; // 0.00125 NEAR in yoctoNEAR
  const TOKEN_CONTRACTS = {
    usdc: "usdc.betvex.testnet",
    vex: "token.betvex.testnet",
  };

  const quickAmounts = [5, 10, 25, 50, 100];

  const debouncedUsername = useDebounce(username, 500);

  // Handle amount change with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    // Validate amount
    if (parseFloat(value) < 1) {
      setMessage("Minimum gift amount is 1");
    } else {
      setMessage("");
    }
  };

  // Handle username change
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Reset account status until debounce finishes
    if (accountStatus) {
      setAccountStatus(null);
      setAccountType(null);
    }
  };

  // Determine account type based on input pattern
  React.useEffect(() => {
    if (!debouncedUsername || debouncedUsername.trim() === "") {
      setAccountType(null);
      setAccountStatus(null);
      return;
    }

    const determineAccountType = () => {
      const username = debouncedUsername.trim();

      // Check for Ethereum-style address (starts with 0x)
      if (username.startsWith("0x")) {
        return "ethereum";
      }

      // Check for .testnet or .near account
      if (username.endsWith(".testnet") || username.endsWith(".near")) {
        return "near";
      }

      // Check for simple username (which could be a BetVEX user or top-level NEAR account)
      if (username.length > 0) {
        // Top-level accounts are shorter than 32 characters
        if (username.length < 32 && !username.includes(".")) {
          return "toplevel";
        } else {
          return "betvex";
        }
      }

      return null;
    };

    const newAccountType = determineAccountType();
    setAccountType(newAccountType);

    // If the account type has changed, check if it exists
    if (newAccountType) {
      checkAccountExists(debouncedUsername, newAccountType);
    }
  }, [debouncedUsername]);

  // Check if account exists
  const checkAccountExists = async (username, type) => {
    if (!username || username.trim() === "") return;

    setIsCheckingAccount(true);
    setAccountStatus(null);

    try {
      // For BetVEX users, check in our GraphQL database
      if (type === "betvex") {
        const formattedUsername = username.trim();
        const fullUsername = `${formattedUsername}.users.betvex.testnet`;

        const query = gql`
          {
            users({where: {id: "${fullUsername}"}}) {
              id
            }
          }
        `;

        const result = await request(QueryURL, query);

        if (result.users && result.users.length > 0) {
          setAccountStatus("exists");
        } else {
          // If not found as BetVEX user, check if it's a top-level account
          setAccountType("toplevel");
          await checkNearAccount(username);
        }
      }
      // For NEAR accounts (including top-level), check via NEAR API
      else if (type === "near" || type === "toplevel") {
        await checkNearAccount(username);
      }
      // For Ethereum addresses, do a basic format validation
      else if (type === "ethereum") {
        // Simple format validation for Ethereum addresses
        const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(username);
        setAccountStatus(isValidFormat ? "exists" : "invalid");
      }
    } catch (error) {
      console.error("Error checking account:", error);
      setAccountStatus("error");
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Check if NEAR account exists
  const checkNearAccount = async (accountId) => {
    try {
      // Prepare the JSON-RPC payload for the view_account method
      const payload = {
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "view_account",
          finality: "final",
          account_id: accountId,
        },
      };

      const response = await fetch(NearRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response from NEAR RPC:", data);

      // If an error is returned, handle account not found or other errors.
      if (data.error) {
        // Check for a specific error indicating the account does not exist
        if (data.error.data && data.error.data.name === "UNKNOWN_ACCOUNT") {
          setAccountStatus("not_found");
        } else {
          setAccountStatus("error");
        }
      } else if (data.result) {
        // Account exists if the result is returned successfully
        setAccountStatus("exists");
      }
    } catch (error) {
      console.error("Error checking NEAR account:", error);
      setAccountStatus("error");
    }
  };

  // Get formatted recipient ID based on account type
  const getFormattedRecipientId = () => {
    if (!username) return "";

    const cleanUsername = username.trim();

    switch (accountType) {
      case "betvex":
        return `${cleanUsername}.users.betvex.testnet`;
      case "near":
        return cleanUsername; // Already has .testnet or .near
      case "toplevel":
        return cleanUsername; // Top-level account
      case "ethereum":
        return cleanUsername; // Ethereum address
      default:
        return cleanUsername;
    }
  };

  /**
   * Checks if an account is registered with a token contract
   */
  const isAccountRegistered = async (accountToCheck, tokenContractId) => {
    try {
      setIsCheckingRegistration(true);
      const provider = new providers.JsonRpcProvider(NearRpcUrl);
      const args = { account_id: accountToCheck };

      const result = await provider.query({
        request_type: "call_function",
        account_id: tokenContractId,
        method_name: "storage_balance_of",
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "final",
      });

      const balance = JSON.parse(Buffer.from(result.result).toString());

      // Account is registered if they have a storage balance >= minimum required
      return (
        balance !== null &&
        BigInt(balance.total) >= BigInt(STORAGE_DEPOSIT_AMOUNT)
      );
    } catch (error) {
      console.error(
        `Error checking registration for ${accountToCheck}:`,
        error
      );
      return false;
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  /**
   * Calls the storage_deposit method on the token contract
   */
  const registerAccount = async (targetAccountId, tokenContractId) => {
    try {
      if (web3auth?.connected) {
        // For social login, use near connection to call storage_deposit
        const account = await nearConnection.account(web3authAccountId);
        await account.functionCall({
          contractId: tokenContractId,
          methodName: "storage_deposit",
          args: { account_id: targetAccountId },
          gas: "30000000000000", // 30 TGas
          attachedDeposit: STORAGE_DEPOSIT_AMOUNT,
        });
      } else if (wallet) {
        // For NEAR wallet login
        await wallet.callMethod({
          contractId: tokenContractId,
          method: "storage_deposit",
          args: { account_id: targetAccountId },
          gas: "30000000000000", // 30 TGas
          deposit: STORAGE_DEPOSIT_AMOUNT,
        });
      } else {
        throw new Error("No wallet connected");
      }
      return true;
    } catch (error) {
      console.error(`Error registering ${targetAccountId}:`, error);
      setMessage(`Failed to register ${targetAccountId}. ${error.message}`);
      return false;
    }
  };

  /**
   * Transfers tokens to the specified account
   */
  const transferTokens = async (
    targetAccountId,
    tokenAmount,
    tokenContractId
  ) => {
    try {
      const decimals = giftType === "usdc" ? 6 : 18;
      const amountInSmallestUnit = BigInt(
        Math.floor(parseFloat(tokenAmount) * Math.pow(10, decimals))
      ).toString();

      if (web3auth?.connected) {
        // For social login
        const account = await nearConnection.account(web3authAccountId);
        await account.functionCall({
          contractId: tokenContractId,
          methodName: "ft_transfer",
          args: {
            receiver_id: targetAccountId,
            amount: amountInSmallestUnit,
          },
          gas: "30000000000000", // 30 TGas
          attachedDeposit: "1",
        });
      } else if (wallet) {
        // For NEAR wallet login
        await wallet.callMethod({
          method: "ft_transfer",
          args: {
            receiver_id: targetAccountId,
            amount: amountInSmallestUnit,
          },
          contractId: tokenContractId,
          deposit: 1,
        });
      } else {
        throw new Error("No wallet connected");
      }
      return true;
    } catch (error) {
      console.error(`Error transferring tokens to ${targetAccountId}:`, error);
      setMessage(`Failed to transfer tokens. ${error.message}`);
      return false;
    }
  };

  // Handle gift submission
  const handleGift = async () => {
    if (!username) {
      setMessage("Please enter a username");
      return;
    }

    if (parseFloat(amount) < 1) {
      setMessage("Amount must be greater than 1");
      return;
    }

    if (accountStatus !== "exists") {
      setMessage("Please enter a valid recipient account");
      return;
    }

    if (!wallet && !web3auth?.connected) {
      setMessage("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const formattedRecipient = getFormattedRecipientId();
      const selectedTokenContract = TOKEN_CONTRACTS[giftType];

      const isRegistered = await isAccountRegistered(
        formattedRecipient,
        selectedTokenContract
      );

      if (isRegistered) {
        setMessage("Sending gift...");
        const success = await transferTokens(
          formattedRecipient,
          amount,
          selectedTokenContract
        );
        if (success) {
          setMessage(
            `Gift of ${amount} ${giftType.toUpperCase()} sent to ${formattedRecipient} successfully!`
          );

          // Reset form after successful submission
          setTimeout(() => {
            setAmount(1.0);
            setUsername("");
            setMessage("");
            setAccountStatus(null);
            setAccountType(null);
            setIsOpen(false);
            toggleRefreshBalances();
          }, 2000);
        }
      } else {
        // Account needs to be registered first
        if (web3auth?.connected) {
          // For social login, do sequential calls
          const registrationSuccess = await registerAccount(
            formattedRecipient,
            selectedTokenContract
          );
          if (!registrationSuccess) {
            throw new Error("Registration failed");
          }

          setMessage("Sending gift...");
          const transferSuccess = await transferTokens(
            formattedRecipient,
            amount,
            selectedTokenContract
          );
          if (transferSuccess) {
            setMessage(
              `Gift of ${amount} ${giftType.toUpperCase()} sent to ${formattedRecipient} successfully!`
            );

            // Reset form after successful submission
            setTimeout(() => {
              setAmount(1.0);
              setUsername("");
              setMessage("");
              setAccountStatus(null);
              setAccountType(null);
              setIsOpen(false);
              toggleRefreshBalances();
            }, 2000);
          }
        } else if (wallet) {
          // For NEAR wallet, use batch actions
          setMessage("Sending gift...");
          try {
            // Create batch transactions for registration and transfer
            await wallet
              .callMethod({
                contractId: selectedTokenContract,
                method: "storage_deposit",
                args: { account_id: formattedRecipient },
                gas: "30000000000000",
                deposit: STORAGE_DEPOSIT_AMOUNT,
              })
              .then(() => {
                const decimals = giftType === "usdc" ? 6 : 18;
                const amountInSmallestUnit = BigInt(
                  Math.floor(parseFloat(amount) * Math.pow(10, decimals))
                ).toString();

                return wallet.callMethod({
                  method: "ft_transfer",
                  args: {
                    receiver_id: formattedRecipient,
                    amount: amountInSmallestUnit,
                  },
                  contractId: selectedTokenContract,
                  deposit: 1,
                });
              });

            setMessage(
              `Gift of ${amount} ${giftType.toUpperCase()} sent to ${formattedRecipient} successfully!`
            );

            // Reset form after successful submission
            setTimeout(() => {
              setAmount(1.0);
              setUsername("");
              setMessage("");
              setAccountStatus(null);
              setAccountType(null);
              setIsOpen(false);
              toggleRefreshBalances();
            }, 2000);
          } catch (error) {
            console.error("Batch transaction failed:", error);
            throw new Error(`Batch transaction failed: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send gift:", error);
      const errorMessage =
        error.message || "Transaction failed. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal content click to prevent close on content click
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Render account status indicator
  const renderAccountStatus = () => {
    if (isCheckingAccount) {
      return (
        <span className="account-status checking">
          <Loader size={16} className="spinning" />
          Checking...
        </span>
      );
    }

    if (!username || !accountStatus) return null;

    switch (accountStatus) {
      case "exists":
        return (
          <span className="account-status valid">
            <CheckCircle size={16} />
            Valid account
          </span>
        );
      case "invalid":
        return (
          <span className="account-status invalid">
            <AlertCircle size={16} />
            Invalid account
          </span>
        );
      case "error":
        return (
          <span className="account-status error">
            <AlertCircle size={16} />
            Error checking account
          </span>
        );
      default:
        return null;
    }
  };

  // Render account type description
  const renderAccountTypeDescription = () => {
    if (!accountType || !username) return null;

    let description = "";
    switch (accountType) {
      case "betvex":
        description = `BetVEX user: ${username}.users.betvex.testnet`;
        break;
      case "near":
        description = `NEAR account: ${username}`;
        break;
      case "toplevel":
        description = `NEAR top-level account: ${username}`;
        break;
      case "ethereum":
        description = `Ethereum address: ${username}`;
        break;
      default:
        return null;
    }

    return <div className="account-type-description">{description}</div>;
  };

  return (
    <Dialog.Root open={open} className="GiftModal">
      <Dialog.Portal>
        <Dialog.Overlay
          className="dialog-overlay"
          onClick={() => setIsOpen(false)}
        />
        <Dialog.Content className="dialog-content" onClick={handleContentClick}>
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">
              <Gift size={20} />
              <span>Send Gift</span>
            </Dialog.Title>
            <Dialog.Description className="dialog-description">
              Send VEX or USD tokens to your friends on the platform.
            </Dialog.Description>
          </div>

          <div className="gift-form">
            {/* Gift Type Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="gift-type">
                Gift Type
              </label>
              <div className="gift-type-selector">
                <button
                  className={`gift-type-option ${
                    giftType === "usdc" ? "active" : ""
                  }`}
                  onClick={() => setGiftType("usdc")}
                >
                  <img
                    src={"/icons/USDC.svg"}
                    alt="USDC"
                    className="gift-type-option__icon"
                  />
                  <span>USD</span>
                </button>
                <button
                  className={`gift-type-option ${
                    giftType === "vex" ? "active" : ""
                  }`}
                  onClick={() => setGiftType("vex")}
                >
                  <img
                    src={"/icons/VEX.svg"}
                    alt="VEX Token Logo"
                    className="gift-type-option-icon"
                  />
                  <span>VEX</span>
                </button>
              </div>
            </div>

            {/* Username Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Recipient Username or Address
              </label>
              <div className="username-input-wrapper">
                <input
                  className="form-input"
                  id="username"
                  type="text"
                  placeholder="Enter recipient's username or address"
                  onChange={handleUsernameChange}
                  value={username}
                />
                <div className="username-status">{renderAccountStatus()}</div>
              </div>
              {renderAccountTypeDescription()}
            </div>

            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount
              </label>
              <div className="amount-input-wrapper">
                <input
                  className="form-input"
                  id="amount"
                  type="number"
                  step="0.1"
                  placeholder="1.00"
                  min="1.00"
                  onChange={handleAmountChange}
                  value={amount}
                />
                <span className="amount-currency">
                  {giftType.toUpperCase() === "USDC" ? "USD" : "VEX"}
                </span>
              </div>
              <div className="quick-amounts">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    className={`quick-amount-button ${
                      parseFloat(amount) === quickAmount ? "active" : ""
                    }`}
                    onClick={() => setAmount(quickAmount)}
                  >
                    {quickAmount}
                  </button>
                ))}
              </div>
              <div className="amount-helpers">
                <span>Min: 1.00</span>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`message-box ${
                  message.includes("successfully") ? "success" : "warning"
                }`}
              >
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`gift-button ${isSubmitting ? "submitting" : ""}`}
                onClick={handleGift}
                disabled={
                  isSubmitting ||
                  !username ||
                  amount < 1 ||
                  accountStatus !== "exists"
                }
              >
                {isSubmitting ? (
                  <span className="gift-loading-spinner"></span>
                ) : (
                  <>
                    <span>Send Gift</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="close-button"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Custom hook for debouncing values
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default GiftModal;
