/**
 * Configuration file
 * more values need to be added here
 *
 */

// Mapping of contract addresses per network
const contractPerNetwork = {
  testnet: "vex-contract-12.testnet",
};

// The network ID to be used ("testnet" or "mainnet")
export const NetworkId = "testnet";

const evmWalletChains = {
  mainnet: {
    chainId: 397,
    name: "Near Mainnet",
    explorer: "https://eth-explorer.near.org",
    rpc: "https://eth-rpc.mainnet.near.org",
  },
  testnet: {
    chainId: 398,
    name: "Near Testnet",
    explorer: "https://eth-explorer-testnet.near.org",
    rpc: "https://eth-rpc.testnet.near.org",
  },
};

// The contract address for the guestbook on the specified network
export const VexContract = contractPerNetwork[NetworkId];

export const UsdcTokenContract = "usdc.betvex.testnet";
export const VexTokenContract = "token.betvex.testnet";
export const ReceiverId = "ref-finance-101.testnet"; // Ref.Finance contract for swapping
export const PoolId = 2197; // Ref.Finance pool for VEX-USDC

export const BetContractId = contractPerNetwork[NetworkId];
export const NearRpcUrl = "https://test.rpc.fastnear.com";
export const EVMWalletChain = evmWalletChains[NetworkId];

// Backend API URL for fetching matches
// export const BackendApiUrl = "https://vexdb-production.up.railway.app/matches";
export const QueryURL = process.env.NEXT_PUBLIC_QUERY_URL;
