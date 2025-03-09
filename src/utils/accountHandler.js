import { EventEmitter } from "events";
import { createAccount, relayTransaction } from "@near-relay/client";
import { actionCreators } from "@near-js/transactions";
import { NetworkId } from "@/app/config";

const passwordEmitter = new EventEmitter();
const CREATE_ACCOUNT_URL = "/api/relayer/create-account";
const RELAY_URL = "/api/relayer";
const NETWORK = NetworkId;

export const handleTransaction = async (
  contractId,
  methodName,
  args,
  gas,
  deposit,
  wallet = null,
  password,
) => {
  const storedAccounts = Object.keys(localStorage).filter((key) =>
    key.startsWith("near-account-"),
  );

  if (storedAccounts.length === 0 && (!wallet || !wallet.selector)) {
    throw new Error("No stored account or wallet available for transaction.");
  }

  if (storedAccounts.length > 0) {
    const storedAccount = localStorage.getItem(storedAccounts[0]);
    if (!storedAccount) {
      throw new Error("Failed to retrieve stored account.");
    }

    const action = actionCreators.functionCall(
      methodName,
      args,
      BigInt(gas),
      BigInt(deposit),
    );

    try {
      const receipt = await relayTransaction(
        action,
        contractId,
        RELAY_URL,
        NETWORK,
        { password },
      );
      console.log("Relay transaction successful!", receipt);
      return receipt;
    } catch (error) {
      console.error("Failed to relay transaction:", error.message || error);
      throw error;
    }
  }

  try {
    const outcome = await wallet.callMethod({
      contractId: contractId,
      method: methodName,
      args: args,
      gas: gas,
      deposit: deposit,
    });

    console.log("Transaction successful!", outcome);
    return outcome;
  } catch (error) {
    console.error("Failed to execute transaction:", error.message || error);
    throw error;
  }
};

export const handleCreateAccount = async (accountId, password) => {
  try {
    console.log("Creating account with ID:", accountId);

    const receipt = await createAccount(CREATE_ACCOUNT_URL, accountId, {
      password,
    });

    console.log("Account created successfully!", receipt);
    return receipt.transaction;
  } catch (error) {
    console.error("Failed to create account:", error.message || error);
    throw error;
  }
};

// Create a modal somewhere
export const submitPassword = (password) => {
  passwordEmitter.emit("passwordEntered", password);
};

// const PasswordModal = ({ isOpen, onClose, onSubmit }) => {

//     //OPEN MODAL
//     passwordEmitter.on('requestPassword', handleRequestPassword);

//     //WHEN SUBMITTED FORM
//     submitPassword(password)

export const fetchAccountId = () => {
  const accountKey = Object.keys(localStorage).find((key) =>
    key.startsWith("near-account"),
  );

  const { accountId } = localStorage.getItem(accountKey);

  return {
    accountId,
  };
};
