import * as React from "react";
import { Dialog } from "radix-ui";
import "./DepositModal.css";
import { useNear } from "@/app/context/NearContext";
import { useState, useEffect } from "react";

const DepositModal = () => {
  const nearContext = useNear();
  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";
  const accountId = isVexLogin
    ? localStorage.getItem("vexAccountId")
    : nearContext?.signedAccountId || null;
  const wallet = isVexLogin ? null : nearContext?.wallet || null;

  const [amount, setAmount] = useState(1.0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (amount > 100 || amount <= 1) {
      setMessage("Your amount must be between 1 and 100 USDC.");
    } else {
      setMessage("");
    }
  }, [amount]);

  const depositFunds = async (inputAmount) => {
    try {
      setMessage("");
      const contractId = "v2.faucet.nonofficial.testnet";
      // Convert amount to proper format (assuming 6 decimals for USDC)
      const amountInSmallestUnit = Math.round(
        parseFloat(inputAmount) * 1000000
      ).toString();

      const args = {
        amount: amountInSmallestUnit,
        receiver_id: accountId, // Fixed typo from "reciever_id"
        ft_contract_id: "usdc.betvex.testnet",
      };

      console.log("args:", args);
      console.log("amountInSmallestUnit:", amountInSmallestUnit);

      console.log("wallet:", wallet);

      const res = await wallet.callMethod({
        contractId: contractId,
        method: "ft_request_funds",
        args: args,
        gas: "100000000000000",
        // deposit: "1",
      });

      console.log("res:", res);
    } catch (error) {
      console.error("Failed to deposit funds:", error);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="nav-link-deposit">Deposit</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Deposit Funds</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Deposit funds to your account.
          </Dialog.Description>
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
            <button className="max-button" onClick={() => setAmount(100)}>
              Max
            </button>
            {/* Tell user how much they can deposit */}
          </fieldset>
          <p className="deposit-amount">
            {message
              ? message
              : `You will receive ${amount} USDC in your account.`}
          </p>
          <div
            style={{
              display: "flex",
              marginTop: 25,
              justifyContent: "flex-end",
            }}
          >
            <button
              className="Button green"
              disabled={amount > 100 || amount < 0}
              onClick={() => depositFunds(amount)}
            >
              Deposit USDC to your account
            </button>
          </div>
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
