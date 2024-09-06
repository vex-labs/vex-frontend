import { initNear, Pool } from '@ref-finance/ref-sdk';

export default async function handler(req, res) {
  try {
    console.log('API Route Hit'); // Check if this log appears

    const nearConfig = {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    };

    console.log('Initializing NEAR');
    const near = await initNear(nearConfig);
    const refFinancePool = new Pool(near);

    console.log('Fetching Pool Data');
    const poolData = await refFinancePool.getPool(2197);
    console.log('Pool Data:', poolData); // Add logging for debugging

    res.status(200).json(poolData);
  } catch (error) {
    console.error('Error in API:', error); // Log the exact error
    res.status(500).json({ error: 'Failed to fetch pool data', details: error.message });
  }
}
