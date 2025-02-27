import { createContext, useContext, useState, useEffect } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import {
  WEB3AUTH_NETWORK,
  CHAIN_NAMESPACES,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { connect, KeyPair, keyStores, utils } from "near-api-js";
import { getED25519Key } from "@web3auth/base-provider";

// Set up web3 auth stuff
const Web3AuthContext = createContext({});

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "0x4e454153",
  rpcTarget: "https://test.rpc.fastnear.com",
  displayName: "Near",
  blockExplorerUrl: "https://testnet.nearblocks.io/",
  ticker: "NEAR",
  tickerName: "NEAR",
  decimals: 24,
  isTestnet: true,
};

const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig: chainConfig },
});

const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

export function Web3AuthProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [nearConnection, setNearConnection] = useState(null);
  const [web3auth, setWeb3auth] = useState(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [keyPair, setKeyPair] = useState(null);

  // Handle client-side initialization and restore keypair
  useEffect(() => {
    setIsClientLoaded(true);
    const storedKeyPair = localStorage.getItem("web3auth_keypair");
    if (storedKeyPair) {
      const restoredKeyPair = KeyPair.fromString(storedKeyPair);
      setKeyPair(restoredKeyPair);
    }
  }, []);

  // Restore session to only restore keypair
  useEffect(() => {
    const restoreSession = async () => {
      if (!isClientLoaded || !keyPair || !web3auth) return;

      try {
        const storedAccountId = localStorage.getItem("accountId");

        if (storedAccountId) {
          await setupNearConnection(keyPair, storedAccountId);
          setAccountId(storedAccountId);
        }

        // If we have a keypair but no account, we need to force account creation
        if (!storedAccountId) {
          // The CreateAccountModal will show automatically due to the effect in Navigation
          return;
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        // Clear everything if there's an error
        localStorage.removeItem("web3auth_keypair");
        localStorage.removeItem("accountId");
        setKeyPair(null);
        setAccountId(null);
      }
    };

    if (web3auth) {
      restoreSession();
    }
  }, [web3auth, isClientLoaded, keyPair]);

  // Initialize web3 auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        const web3authInstance = new Web3AuthNoModal({
          clientId: WEB3AUTH_CLIENT_ID, // Use hardcoded client ID
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider: privateKeyProvider,
        });

        const authAdapter = new AuthAdapter();
        web3authInstance.configureAdapter(authAdapter);

        await web3authInstance.init();
        setWeb3auth(web3authInstance);
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    initWeb3Auth();
  }, []);

  // Set up near connection
  const setupNearConnection = async (keyPair, newAccountId) => {
    try {
      const myKeyStore = new keyStores.InMemoryKeyStore();
      await myKeyStore.setKey("testnet", newAccountId, keyPair);

      const connectionConfig = {
        networkId: "testnet",
        keyStore: myKeyStore,
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };

      const connection = await connect(connectionConfig);
      setNearConnection(connection);
      return connection;
    } catch (error) {
      console.error("Error setting up NEAR connection:", error);
      throw error;
    }
  };

  // Get near key from web3auth provider
  const getNearCredentials = async (web3authProvider) => {
    try {
      const privateKey = await web3authProvider.request({
        method: "private_key",
      });
      const privateKeyEd25519 = getED25519Key(privateKey).sk.toString("hex");
      const privateKeyEd25519Buffer = Buffer.from(privateKeyEd25519, "hex");
      const bs58encode = utils.serialize.base_encode(privateKeyEd25519Buffer);
      const newKeyPair = KeyPair.fromString(`ed25519:${bs58encode}`);
      setKeyPair(newKeyPair);

      // Store only the keypair in localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("web3auth_keypair", newKeyPair.toString());
        } catch (error) {
          console.error("Failed to store keypair in localStorage:", error);
        }
      }

      // Don't setup connection yet - wait for account creation
      return { keyPair: newKeyPair };
    } catch (error) {
      console.error("Error getting NEAR credentials:", error);
      throw error;
    }
  };

  // Set up near account object
  const setupAccount = async (accountId, providedKeyPair = null) => {
    try {
      // Use provided keyPair if available, otherwise use state keyPair
      const keyPairToUse = providedKeyPair || keyPair;

      if (!keyPairToUse) throw new Error("No keypair available");

      await setupNearConnection(keyPairToUse, accountId);
      setAccountId(accountId);

      // Store account IDs in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accountId", accountId);
      }
    } catch (error) {
      console.error("Error setting up account:", error);
      throw error;
    }
  };

  // Login with web3 auth provider
  const loginWithProvider = async (loginProvider, extraLoginOptions = {}) => {
    try {
      const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: loginProvider,
        ...extraLoginOptions,
      });
      setProvider(web3authProvider);

      // Get credentials and check for existing account
      const { keyPair: theKeyPair } =
        await getNearCredentials(web3authProvider);
      const publicKey = theKeyPair.getPublicKey().toString();

      // Check if account exists
      const response = await fetch("/api/auth/check-for-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicKey }),
      });

      const data = await response.json();

      if (data.exists) {
        // Account exists, set it up
        await setupAccount(data.accountId, theKeyPair);
        return web3authProvider;
      }

      // If no account exists, the CreateAccountModal will show automatically
      // due to the effect in Navigation component that checks for
      return web3authProvider;
    } catch (error) {
      console.error(`Login with ${loginProvider} failed:`, error);
      throw error;
    }
  };

  // Logout web3auth provider
  const logout = async () => {
    try {
      if (web3auth?.connected) {
        await web3auth.logout();
        setProvider(null);
        setAccountId(null);
        setNearConnection(null);
        setKeyPair(null);
        // Clear storage
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("web3auth_keypair");
            localStorage.removeItem("accountId");
          } catch (error) {
            console.error("Failed to clear localStorage:", error);
          }
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        accountId,
        setAccountId,
        nearConnection,
        keyPair,
        setupAccount,
        loginWithProvider,
        logout,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
}
