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

const GiftModal = ({ open, setIsOpen }) => {
  const [amount, setAmount] = React.useState(1.0);
  const [giftType, setGiftType] = React.useState("usdc");
  const [username, setUsername] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = React.useState(false);
  const [accountStatus, setAccountStatus] = React.useState(null);
  const [accountType, setAccountType] = React.useState(null);
  const quickAmounts = [5, 10, 25, 50, 100];

  const debouncedUsername = useDebounce(username, 500);

  // Handle amount change with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    // Validate amount
    if (parseFloat(value) > 100) {
      setMessage("Maximum gift amount is 100");
    } else if (parseFloat(value) < 1) {
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

  // Handle gift submission
  const handleGift = () => {
    if (!username) {
      setMessage("Please enter a username");
      return;
    }

    if (parseFloat(amount) < 1 || parseFloat(amount) > 100) {
      setMessage("Amount must be between 1 and 100");
      return;
    }

    if (accountStatus !== "exists") {
      setMessage("Please enter a valid recipient account");
      return;
    }

    setIsSubmitting(true);
    const formattedRecipient = getFormattedRecipientId();

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
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
      }, 2000);
    }, 1500);
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
              Send VEX or USDC tokens to your friends on the platform.
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
                  <DollarSign size={16} />
                  <span>USDC</span>
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
                  max="100"
                  onChange={handleAmountChange}
                  value={amount}
                />
                <span className="amount-currency">
                  {giftType.toUpperCase()}
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
                <span>Max: 100.00</span>
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
                  <span className="loading-spinner"></span>
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
