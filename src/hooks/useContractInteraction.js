import { useWeb3Auth } from "@/context/Web3AuthContext";
import { useNear } from "@/context/NearContext";
import { providers } from "near-api-js";

export function useContractInteraction() {
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();

  const getGreeting = async () => {
    try {
      const viewContract = async ({ contractId, methodName, args = {} }) => {
        const url = `https://rpc.testnet.near.org`;
        const provider = new providers.JsonRpcProvider({ url });

        const argsBase64 = args
          ? Buffer.from(JSON.stringify(args)).toString("base64")
          : "";

        const viewCallResult = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: methodName,
          args_base64: argsBase64,
          finality: "optimistic",
        });

        return JSON.parse(Buffer.from(viewCallResult.result).toString());
      };

      const result = await viewContract({
        contractId: "hello.near-examples.testnet",
        methodName: "get_greeting",
      });

      return result;
    } catch (error) {
      console.error("Error getting greeting:", error);
      throw error;
    }
  };

  const setGreeting = async (newGreeting) => {
    if (!newGreeting?.trim()) {
      throw new Error("Please enter a greeting");
    }

    // If using Web3Auth
    if (web3auth?.connected) {
      const account = await nearConnection.account(web3authAccountId);
      return account.functionCall({
        contractId: "hello.near-examples.testnet",
        methodName: "set_greeting",
        args: {
          greeting: newGreeting,
        },
        gas: 100000000000000,
        deposit: 0,
      });
    }

    // If using NEAR Wallet
    if (signedAccountId && wallet) {
      return wallet.callMethod({
        contractId: "hello.near-examples.testnet",
        method: "set_greeting",
        args: {
          greeting: newGreeting,
        },
      });
    }

    throw new Error("Please connect your wallet first");
  };

  return {
    getGreeting,
    setGreeting,
    isLoggedIn: web3auth?.connected || !!signedAccountId,
    currentAccountId: signedAccountId || web3authAccountId,
  };
}
