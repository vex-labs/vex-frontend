import { connect, keyStores, utils } from 'near-api-js';

export default async function handler(req, res) {
  const { amount } = req.body;
  if (amount < 1 || amount > 100) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  try {
    
    const keyStore = new keyStores.InMemoryKeyStore();
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    keyStore.setKey("testnet", "relayer_account.testnet", utils.KeyPair.fromString(privateKey));

    const near = await connect({
      networkId: "testnet",
      keyStore,
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    });

    const account = await near.account("relayer_account.testnet");

    const amountInYocto = (amount * 1_000_000).toString();

    // Call faucet contract
    const result = await account.functionCall({
      contractId: "v2.faucet.nonofficial.testnet",
      methodName: "ft_request_funds",
      args: {
        amount: amountInYocto,
        receiver_id: "your_user_wallet_id_here", 
        ft_contract_id: "usdc.betvex.testnet",
      },
      gas: "300000000000000", 
    });

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
