import React, { useState, useEffect } from 'react';
import { swapTokens } from '@/utils/swapTokens';
import { handleTransaction } from '@/utils/accountHandler';
import { providers } from 'near-api-js';

const Swap = ({ signedAccountId, isVexLogin, wallet }) => {
  const [vexAmount, setVexAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [displayUsdcAmount, setDisplayUsdcAmount] = useState('');
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const getOutputAmount = async (vexAmount) => {
    try {
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
      const contractId = "ref-finance-101.testnet"; // Ref Finance contract on testnet
      const poolId = 2197; // Ensure this is the correct pool ID containing VEX and USDC
  
      // Convert VEX amount to smallest unit (e.g., yocto units)
    const amountInYocto = BigInt(Math.floor(vexAmount * Math.pow(10, 18))).toString();

    const args = {
      pool_id: poolId,
      token_in: "token.betvex.testnet", // Replace with actual VEX contract ID on testnet
      amount_in: amountInYocto,
      token_out: "usdc.betvex.testnet" // Replace with actual USDC contract ID on testnet
    };

    const result = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: "get_return",
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: "final"
    });

    const decodedResult = JSON.parse(Buffer.from(result.result).toString());
    const usdcEquivalent = decodedResult / Math.pow(10, 6); // USDC has 6 decimals

    setUsdcAmount(usdcEquivalent.toFixed(6)); // Full precision value used in min_amount_out
      setDisplayUsdcAmount(usdcEquivalent.toFixed(2)); // Display rounded value for UI

    return usdcEquivalent;
  } catch (error) {
    console.error("Failed to fetch output amount:", error);
    return "Error";
  }
};

  const handleAmountChange = async (e) => {
    const newAmount = e.target.value;
    if (newAmount === '' || isNaN(newAmount)) {
      setVexAmount('');
      setUsdcAmount('');
      return;
    }

    setVexAmount(newAmount);
    console.log("VEX Amount Input Set to:", newAmount);

    const usdcEquivalent = await getOutputAmount(newAmount);
    setUsdcAmount(usdcEquivalent);
  };

  const handleNearSwap = async () => {
    if (!wallet) {
      alert('Wallet is not initialized.');
      return;
    }

    const tokenAmount = parseFloat(vexAmount || '0');
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const formattedAmount = (tokenAmount * Math.pow(10, 18)).toFixed(0); // VEX has 18 decimals

    try {
      const outcome = await swapTokens(wallet, true, formattedAmount); // true for VEX -> USDC direction
      alert('Swap Successful!');
      console.log('Swap outcome:', outcome);
    } catch (error) {
      console.error('Swap failed:', error.message || error);
      alert('Swap Failed.');
    }
  };

  const handleVexSwap = async () => {
    if (!password) {
      setShowPasswordModal(true);
      return;
    }

    const tokenContractId = 'token.betvex.testnet';
    const receiverId = 'ref-finance-101.testnet';
    const poolId = 2197;

    const tokenAmount = parseFloat(vexAmount || '0');
    console.log("Input Amount for VEX Swap:", tokenAmount);

    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      alert('Invalid swap amount.');
      return;
    }

    // Use BigInt conversion to match `amount_in` format used in `getOutputAmount`
    const formattedAmount = BigInt(Math.floor(tokenAmount * Math.pow(10, 18))).toString();
    const minAmountOut = (parseFloat(usdcAmount) * 0.95).toFixed(6); // 5% slippage
    console.log("Formatted Amount for VEX to USDC Swap:", formattedAmount);

    const msg = JSON.stringify({
      force: 0,
      actions: [
        {
          pool_id: poolId,
          token_in: 'token.betvex.testnet',
          token_out: 'usdc.betvex.testnet',
          amount_in: formattedAmount,
          amount_out: '0',
          min_amount_out: BigInt(Math.floor(minAmountOut * Math.pow(10, 6))).toString(),
        }
      ]
    });

    const gas = '100000000000000';
    const deposit = '1';

    try {
      const outcome = await handleTransaction(
        tokenContractId,
        "ft_transfer_call",
        {
          receiver_id: receiverId,
          amount: formattedAmount,
          msg: msg,
        },
        gas,
        deposit,
        wallet,
        password
      );
      console.log("VEX to USDC Swap Successful:", outcome);
      alert("VEX to USDC Swap Successful!");
    } catch (error) {
      console.error("VEX Swap failed:", error);
      alert("VEX Swap Failed.");
    }
  };

  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    localStorage.setItem("vexPassword", enteredPassword);
    setShowPasswordModal(false);
    handleVexSwap();
  };

  const handleSwap = () => {
    console.log("Signed Account ID:", signedAccountId);
    console.log("Is VEX Login:", isVexLogin);

    if (signedAccountId) {
      handleNearSwap();
    } else if (isVexLogin) {
      handleVexSwap();
    } else {
      alert("Please log in first.");
    }
  };

  return (
    <div className="swap-container">
      <div className="token-box">
        <div className="token-info">
          <img src="/icons/g12.svg" alt="VEX Token Logo" className="token-logo" />
          <div>
            <p className="token-name">VEX</p>
          </div>
        </div>
        <input
          type="number"
          placeholder=""
          value={vexAmount}
          onChange={handleAmountChange}
          className="token-input"
        />
      </div>

      <div className="token-box">
        <div className="token-info">
          <img src="/icons/usdc-logo.svg" alt="USDC Token Logo" className="token-logo" />
          <div>
            <p className="token-name">USDC</p>
          </div>
        </div>
        <input
          type="text"
          placeholder=""
          value={displayUsdcAmount}
          readOnly
          className="token-input"
        />
      </div>

      <button className="swap-button" onClick={handleSwap}>Swap VEX to USDC</button>

      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Password</h3>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <button onClick={() => handlePasswordSubmit(password)}>Submit</button>
            <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swap;

