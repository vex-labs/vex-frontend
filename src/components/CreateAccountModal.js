import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import "./CreateAccountModal.css";

export const CreateAccountModal = ({ isOpen, onClose, onAccountCreated }) => {
  const { keyPair, setupAccount, logout } = useWeb3Auth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAccountCreated(false);
      setError("");
    }
  }, [isOpen]);

  const handleClose = () => {
    // Only logout if the modal is being closed without an account being created
    // and without any username entered
    if (!isAccountCreated && !username) {
      logout();
    }
    setUsername(""); // Clear the username when closing
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const publicKey = keyPair.getPublicKey().toString();

      // Route to create account in db
      const response = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          publicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to create account: ${data.error}${
            data.details ? ` (${JSON.stringify(data.details)})` : ""
          }`,
        );
      }

      await setupAccount(data.accountId);
      setIsAccountCreated(true);
      onAccountCreated(data.accountId);
      onClose();
    } catch (err) {
      console.error("Error creating account:", err);
      setError(`Failed to create account: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vex-modal">
      <div className="vex-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vex-modal-header">
          <h3>Create Your Account Name</h3>
          <button
            type="button"
            className="vex-close-button"
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="vex-modal-body">
          <form onSubmit={handleSubmit} className="vex-create-account-form">
            <div className="vex-form-group">
              <label className="vex-form-label">Choose your username</label>
              <input
                type="text"
                className="vex-form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
              <div className="vex-form-helper">
                Your full account will be:{" "}
                <span className="vex-account-name">
                  {username ? `${username}.users.betvex.testnet` : ""}
                </span>
              </div>
            </div>

            {error && <div className="vex-error-message">{error}</div>}

            <button
              type="submit"
              className={`vex-btn vex-btn-primary vex-btn-full ${
                isLoading ? "vex-btn-loading" : ""
              }`}
              disabled={isLoading || !keyPair}
            >
              {isLoading ? (
                <>
                  <svg className="vex-spinner" viewBox="0 0 24 24">
                    <circle
                      className="vex-spinner-circle"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="3"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
