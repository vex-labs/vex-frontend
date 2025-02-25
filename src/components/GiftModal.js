import * as React from "react";
import { Dialog } from "radix-ui";
import "./GiftModal.css";
import { Gift, ArrowRight, DollarSign, PlusCircle } from "lucide-react";

const GiftModal = ({ open, setIsOpen }) => {
  const [amount, setAmount] = React.useState(1.0);
  const [giftType, setGiftType] = React.useState("usdc");
  const [username, setUsername] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
  const quickAmounts = [5, 10, 25, 50, 100];

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

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage(
        `Gift of ${amount} ${giftType.toUpperCase()} sent to ${username} successfully!`
      );

      // Reset form after successful submission
      setTimeout(() => {
        setAmount(1.0);
        setUsername("");
        setMessage("");
        setIsOpen(false);
      }, 2000);
    }, 1500);
  };

  // Handle modal content click to prevent close on content click
  const handleContentClick = (e) => {
    e.stopPropagation();
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
                Recipient Username
              </label>
              <div className="username-input-wrapper">
                <input
                  className="form-input"
                  id="username"
                  type="text"
                  placeholder="Enter recipient's username"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                />
              </div>
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
                      amount === quickAmount ? "active" : ""
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
                disabled={isSubmitting || !username || amount < 1}
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

export default GiftModal;
