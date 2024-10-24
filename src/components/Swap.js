import React, { useState } from 'react';
import { providers, transactions, utils, KeyPair } from 'near-api-js'; // NEAR SDK imports
import { swapTokens } from '@/utils/swapTokens';
import { swapTokensWithVexLogin } from '@/utils/swapTokensWithVexLogin'; // Import utility


const Swap = ({ signedAccountId, isVexLogin, wallet }) => {
  const [vexAmount, setVexAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState(true); // true = VEX -> USDC, false = USDC -> VEX

  // Function for NEAR-based swap
  const handleNearSwap = async () => {
    if (!wallet) {
      alert('Wallet is not initialized.');
      return;
    }

    const tokenAmount = swapDirection ? vexAmount : usdcAmount;

    if (!tokenAmount || isNaN(tokenAmount) || parseFloat(tokenAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const formattedAmount = swapDirection
      ? (parseFloat(vexAmount) * Math.pow(10, 18)).toFixed(0) // VEX has 18 decimals
      : (parseFloat(usdcAmount) * Math.pow(10, 6)).toFixed(0); // USDC has 6 decimals

    try {
      const outcome = await swapTokens(wallet, swapDirection, formattedAmount);
      alert('Swap Successful!');
      console.log('Swap outcome:', outcome);
    } catch (error) {
      console.error('Swap failed:', error.message || error);
      alert('Swap Failed.');
    }
  };

  // Function for VEX-based swap
  const handleVexSwap = async () => {
    const publicKey = localStorage.getItem('vexPublicKey');
    const privateKey = localStorage.getItem('vexPrivateKey');

    // Log the public and private key for debugging
    console.log('VEX Public Key:', publicKey);
    console.log('VEX Private Key:', privateKey);

    if (!publicKey || !privateKey) {
      alert('VEX keypair is not available.');
      return;
    }

    const keyPair = KeyPair.fromString(privateKey); // Create the keypair from the private key
    const provider = new providers.JsonRpcProvider('https://rpc.testnet.near.org'); // NEAR testnet provider

    const tokenAmount = swapDirection ? vexAmount : usdcAmount;

    if (!tokenAmount || isNaN(tokenAmount) || parseFloat(tokenAmount) <= 0) {
      alert('Invalid swap amount.');
      return;
    }

    const formattedAmount = swapDirection
      ? (parseFloat(usdcAmount) * Math.pow(10, 6)).toFixed(0) // USDC has 6 decimals
      : (parseFloat(vexAmount) * Math.pow(10, 18)).toFixed(0); // VEX has 18 decimals

    try {
      // Prepare the transaction using the utility function
      const transaction = await swapTokensWithVexLogin(
        swapDirection,
        formattedAmount,
        keyPair,
        provider,
        publicKey
      );

      // Get the block hash for transaction
      const blockHash = utils.serialize.base_decode(transaction.blockHash);

      // Create the transaction
      const tx = transactions.createTransaction(
        transaction.accountId,
        transaction.publicKey,
        transaction.contractId,
        transaction.nonce,
        transaction.actions.map((action) =>
          transactions.functionCall(
            action.methodName,
            action.args,
            action.gas,
            action.deposit
          )
        ),
        blockHash
      );

      // Sign the transaction
      const serializedTx = utils.serialize.serialize(transactions.SCHEMA, tx);
      const serializedTxHash = new Uint8Array(utils.sha256.sha256.array(serializedTx));
      const signature = keyPair.sign(serializedTxHash);

      // Send the signed transaction
      const result = await provider.sendJsonRpc('broadcast_tx_commit', [
        Buffer.concat([serializedTx, signature.signature]).toString('base64'),
      ]);

      console.log('Transaction result:', result);
      alert('VEX Swap Successful!');
    } catch (error) {
      console.error('VEX Swap failed:', error);
      alert('VEX Swap Failed.');
    }
  };

  // Handle the swap button click based on the login type
  const handleSwap = () => {
    console.log('Signed Account ID:', signedAccountId);
    console.log('Is VEX Login:', isVexLogin);

    if (signedAccountId) {
      // If logged in with NEAR, proceed with NEAR swap
      handleNearSwap();
    } else if (isVexLogin) {
      // If logged in with VEX, proceed with VEX swap
      handleVexSwap();
    } else {
      alert('Please log in first.');
    }
  };

  // Toggle swap direction (VEX -> USDC or USDC -> VEX)
  const toggleSwapDirection = () => {
    setSwapDirection(!swapDirection);
    setVexAmount('');
    setUsdcAmount('');
  };

  return (
    <div className="swap-container">
      {/* VEX or USDC Input Box */}
      <div className="token-box">
        <div className="token-info">
          <img src={swapDirection ? "/path/to/vex-logo.png" : "/path/to/usdc-logo.png"} alt="Token Logo" className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'VEX' : 'USDC'}</p>
            <p className="contract-address">Contract address: {swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet'}</p>
          </div>
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={swapDirection ? vexAmount : usdcAmount}
          onChange={(e) => swapDirection ? setVexAmount(e.target.value) : setUsdcAmount(e.target.value)}
          className="token-input"
        />
      </div>

      {/* Swap Icon */}
      <div className="swap-icon" onClick={toggleSwapDirection}>⤾</div>

      {/* USDC or VEX Input Box */}
      <div className="token-box">
        <div className="token-info">
          <img src={swapDirection ? "/path/to/usdc-logo.png" : "/path/to/vex-logo.png"} alt="Token Logo" className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'USDC' : 'VEX'}</p>
            <p className="contract-address">Contract address: {swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet'}</p>
          </div>
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={swapDirection ? usdcAmount : vexAmount}
          onChange={(e) => swapDirection ? setUsdcAmount(e.target.value) : setVexAmount(e.target.value)}
          className="token-input"
        />
      </div>

      {/* Swap Button */}
      <button className="swap-button" onClick={handleSwap}>Swap</button>
    </div>
  );
};

export default Swap;
