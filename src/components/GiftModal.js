import * as React from "react";
import { Dialog } from "radix-ui";
import "./DepositModal.css";

const GiftModal = ({ open, setIsOpen }) => {
  const [amount, setAmount] = React.useState(1.0);
  const [giftType, setGiftType] = React.useState("usdc");
  const [username, setUsername] = React.useState("");

  return (
    <Dialog.Root open={open} setIsOpen={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Gift</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Gift VEX/USDC to your friends.
          </Dialog.Description>
          {/* Select USDC or VEX */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="gift-type">
              Gift Type
            </label>
            <select
              className="Input"
              id="gift-type"
              onChange={(e) => setGiftType(e.target.value)}
              value={giftType}
            >
              <option value="usdc">USDC</option>
              <option value="vex">VEX</option>
            </select>
          </fieldset>
          {/* Enter username */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="username">
              Username
            </label>
            <input
              className="Input"
              id="username"
              type="text"
              placeholder="Enter username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
          </fieldset>
          {/* Tell user how much they can deposit */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="amount">
              Amount
            </label>
            <input
              className="Input"
              id="amount"
              type="number"
              step="1"
              placeholder="1.00"
              min="1.00"
              max="100"
              onChange={(e) => setAmount(e.target.value)}
              value={amount}
            />
            {/* Tell user how much they can deposit */}
          </fieldset>
          <div
            style={{
              display: "flex",
              marginTop: 25,
              justifyContent: "flex-end",
            }}
          >
            <button className="Button green">Gift</button>
          </div>
          <Dialog.Close asChild>
            <button
              className="CloseButton"
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
