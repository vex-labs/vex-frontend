import * as React from "react";
import { Dialog } from "radix-ui";
import "./DepositModal.css";
import { useNear } from "@/app/context/NearContext";
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";

const DepositModal = ({ modalOpen, setModalOpen, modalOnly }) => {
  const { accountId } = useGlobalContext();
  const { toggleRefreshBalances } = useGlobalContext();

  const [amount, setAmount] = useState(1.0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Predefined quick select amounts
  const quickAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    if (amount > 100) {
      setMessage("Maximum deposit amount is 100 USD.");
    } else if (amount < 1) {
      setMessage("Minimum deposit amount is 1 USD.");
    } else {
      setMessage("");
    }
  }, [amount]);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        setAmount(1.0);
        setMessage("");
      }, 300);
    }
  }, [isOpen]);

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    } else {
      setAmount("");
    }
  };

  const callNearFunction = async (accountId, args) => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/relayer/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          args,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || data.message || "Error calling NEAR function";
        throw new Error(errorMessage);
      }

      return data;
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err.message || "Error calling NEAR function";
      setMessage(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const depositFunds = async (inputAmount) => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!accountId) {
        throw new Error("Account ID is missing. Please reconnect your wallet.");
      }

      if (isNaN(parseFloat(inputAmount)) || parseFloat(inputAmount) <= 0) {
        throw new Error("Please enter a valid deposit amount.");
      }

      const amountInSmallestUnit = Math.round(
        parseFloat(inputAmount) * 1000000
      ).toString();

      const args = {
        amount: amountInSmallestUnit,
        receiver_id: accountId,
        ft_contract_id: "usdc.betvex.testnet",
      };

      const result = await callNearFunction(accountId, args);

      setIsSuccess(true);
    } catch (error) {
      console.error("Failed to deposit funds:", error);
      const errorMessage =
        error.message || "Transaction failed. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        toggleRefreshBalances();
      }, 1000);
    }
  };

  return (
    <Dialog.Root
      open={modalOnly ? modalOpen : isOpen}
      onOpenChange={modalOnly ? setModalOpen : setIsOpen}
    >
      {!modalOnly && (
        <Dialog.Trigger asChild>
          <button className="nav-link-deposit">
            <span className="deposit-button-icon">
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
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </span>
            <span className="deposit-button-text">Deposit</span>
          </button>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          {!isSuccess ? (
            <>
              <Dialog.Title className="DialogTitle">Deposit USD</Dialog.Title>
              <Dialog.Description className="DialogDescription">
                Add funds to your account to start betting.
              </Dialog.Description>

              <div className="amount-input-container">
                <div className="amount-input-wrapper">
                  <div className="currency-indicator">USD</div>
                  <input
                    className="Input amount-input"
                    id="amount"
                    type="number"
                    step="1"
                    placeholder="1.00"
                    min="1"
                    max="100"
                    onChange={handleAmountChange}
                    value={amount}
                    disabled={isLoading}
                  />
                </div>

                <div className="quick-amounts">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      className={`quick-amount-button ${
                        amount === quickAmount ? "active" : ""
                      }`}
                      onClick={() => setAmount(quickAmount)}
                      disabled={isLoading}
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {message && (
                <div className="message-container">
                  <p className="message error-message">{message}</p>
                </div>
              )}

              <div className="deposit-info">
                <div className="info-item">
                  <span className="info-label">Amount to deposit:</span>
                  <span className="info-value">{amount || 0} USD</span>
                </div>
              </div>

              <div className="modal-actions">
                <Dialog.Close asChild>
                  <button className="Button cancel-button" disabled={isLoading}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  className={`Button confirm-button ${
                    isLoading ? "loading" : ""
                  }`}
                  disabled={
                    !accountId ||
                    amount > 100 ||
                    amount < 1 ||
                    isLoading ||
                    isNaN(parseFloat(amount))
                  }
                  onClick={() => depositFunds(amount)}
                >
                  {isLoading ? (
                    <>
                      <span className="deposit-modal-spinner"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Confirm Deposit"
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="success-container">
              <div className="success-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                    stroke="#3DD68C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="#3DD68C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="success-title">Deposit Successful!</h3>
              <p className="success-message">
                {amount} USD has been added to your account.
              </p>
              <Dialog.Close asChild>
                <button className="Button success-close-button">Close</button>
              </Dialog.Close>
            </div>
          )}

          <Dialog.Close asChild>
            <button className="CloseButton" aria-label="Close">
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

export default DepositModal;
