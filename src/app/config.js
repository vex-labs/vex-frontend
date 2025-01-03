/**
 * Configuration file
 * more values need to be added here
 * 
 */

// Mapping of contract addresses per network
const contractPerNetwork = {
    testnet: "sexyvexycontract.testnet",
};

// The network ID to be used ("testnet" or "mainnet")
export const NetworkId = "testnet";

// The contract address for the guestbook on the specified network
export const GuestbookNearContract = contractPerNetwork[NetworkId];

export const UsdcTokenContract = 'usdc.betvex.testnet';
export const VexTokenContract = 'token.betvex.testnet';
export const ReceiverId = 'ref-finance-101.testnet'; // Ref.Finance contract for swapping
export const PoolId = 2197; // Ref.Finance pool for VEX-USDC

export const BetContractId = contractPerNetwork[NetworkId];
export const NearRpcUrl = "https://rpc.testnet.near.org";

// Backend API URL for fetching matches
export const BackendApiUrl = "https://vexdb-production.up.railway.app/matches";