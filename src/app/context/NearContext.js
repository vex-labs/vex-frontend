import { createContext, useState, useContext, useEffect } from "react";
import { Wallet } from "@/components/near-wallet";
import { VexContract, NetworkId } from "@/app/config";

export const NearContext = createContext({
  wallet: undefined,
  signedAccountId: "",
});

export function NearProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [signedAccountId, setSignedAccountId] = useState("");
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Handle client-side initialization
  useEffect(() => {
    setIsClientLoaded(true);
    const storedAccountId = localStorage.getItem("near_signed_account_id");
    if (storedAccountId) {
      setSignedAccountId(storedAccountId);
    }
  }, []);

  useEffect(() => {
    if (!isClientLoaded) return;

    const initWallet = async () => {
      const newWallet = new Wallet({
        createAccessKeyFor: VexContract,
        networkId: NetworkId,
      });

      const accountId = await newWallet.startUp(async (signedAccountId) => {
        const newSignedAccountId = signedAccountId || "";

        // If user signed in with wallet, create/verify their DB entry
        if (newSignedAccountId) {
          try {
            const response = await fetch("/api/auth/create-wallet-user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accountId: newSignedAccountId,
              }),
            });

            if (!response.ok) {
              console.error("Failed to create wallet user in database");
            }
          } catch (error) {
            console.error("Error creating wallet user:", error);
          }
        }

        setSignedAccountId(newSignedAccountId);
        localStorage.setItem("near_signed_account_id", newSignedAccountId);
      });

      setWallet(newWallet);
      setSignedAccountId(accountId || "");
      if (accountId) {
        localStorage.setItem("near_signed_account_id", accountId);
      }
    };

    initWallet();
  }, [isClientLoaded]);

  return (
    <NearContext.Provider value={{ wallet, signedAccountId }}>
      {children}
    </NearContext.Provider>
  );
}

export function useNear() {
  return useContext(NearContext);
}
