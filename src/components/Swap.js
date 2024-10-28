import React, { useState, useEffect } from 'react';
import { swapTokens } from '@/utils/swapTokens';
import { handleTransaction } from '@/utils/accountHandler';
import { providers } from 'near-api-js';

const Swap = ({ signedAccountId, isVexLogin, wallet }) => {
  const [vexAmount, setVexAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [displayUsdcAmount, setDisplayUsdcAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState(true); // true = VEX → USDC, false = USDC → VEX
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const getOutputAmount = async (inputAmount) => {
    try {
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
      const contractId = "ref-finance-101.testnet";
      const poolId = 2197;

      const amountInYocto = BigInt(Math.floor(inputAmount * Math.pow(10, swapDirection ? 18 : 6))).toString();

      const args = {
        pool_id: poolId,
        token_in: swapDirection ? "token.betvex.testnet" : "usdc.betvex.testnet",
        amount_in: amountInYocto,
        token_out: swapDirection ? "usdc.betvex.testnet" : "token.betvex.testnet"
      };

      const result = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_return",
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: "final"
      });

      const decodedResult = JSON.parse(Buffer.from(result.result).toString());
      const outputEquivalent = decodedResult / Math.pow(10, swapDirection ? 6 : 18);

      if (swapDirection) {
        setUsdcAmount(outputEquivalent.toFixed(6));
        setDisplayUsdcAmount(outputEquivalent.toFixed(2));
      } else {
        setVexAmount(outputEquivalent.toFixed(6));
      }
    } catch (error) {
      console.error("Failed to fetch output amount:", error);
      return "Error";
    }
  };

  const handleVexAmountChange = async (e) => {
    const newAmount = e.target.value;
    if (newAmount === '' || isNaN(newAmount)) {
      setVexAmount('');
      setDisplayUsdcAmount('');
      return;
    }

    setVexAmount(newAmount);
    if (swapDirection) {
      await getOutputAmount(newAmount);
    }
  };

  const handleUsdcAmountChange = async (e) => {
    const newAmount = e.target.value;
    if (newAmount === '' || isNaN(newAmount)) {
      setUsdcAmount('');
      setVexAmount('');
      return;
    }

    setUsdcAmount(newAmount);
    if (!swapDirection) {
      await getOutputAmount(newAmount);
    }
  };

  const handleNearSwap = async () => {
    if (!wallet) {
      alert('Wallet is not initialized.');
      return;
    }

    const tokenAmount = parseFloat(swapDirection ? vexAmount : usdcAmount || '0');
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      alert('Invalid swap amount.');
      return;
    }

    const formattedAmount = BigInt(Math.floor(tokenAmount * Math.pow(10, swapDirection ? 18 : 6))).toString();

    try {
      const outcome = await swapTokens(wallet, swapDirection, formattedAmount);
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

    const tokenContractId = swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet';
    const receiverId = 'ref-finance-101.testnet';
    const poolId = 2197;

    const tokenAmount = parseFloat(swapDirection ? vexAmount : usdcAmount || '0');
    console.log("Input Amount for Swap:", tokenAmount);

    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      alert('Invalid swap amount.');
      return;
    }

    const formattedAmount = BigInt(Math.floor(tokenAmount * Math.pow(10, swapDirection ? 18 : 6))).toString();
    const minAmountOut = (parseFloat(swapDirection ? usdcAmount : vexAmount) * 0.95).toFixed(6);

    const msg = JSON.stringify({
      force: 0,
      actions: [
        {
          pool_id: poolId,
          token_in: swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet',
          token_out: swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet',
          amount_in: formattedAmount,
          amount_out: '0',
          min_amount_out: BigInt(Math.floor(minAmountOut * Math.pow(10, swapDirection ? 6 : 18))).toString(),
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
      console.log("Swap Successful:", outcome);
      alert("Swap Successful!");
    } catch (error) {
      console.error("Swap failed:", error);
      alert("Swap Failed.");
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

  const toggleSwapDirection = () => {
    setSwapDirection(!swapDirection);
    setVexAmount('');
    setUsdcAmount('');
    setDisplayUsdcAmount('');
  };

  return (
    <div className="swap-container">
      <button onClick={toggleSwapDirection}>Switch to {swapDirection ? 'USDC to VEX' : 'VEX to USDC'}</button>
      <div className="token-box">
        <div className="token-info">
          <img src={swapDirection ? "/icons/g12.svg" : "/icons/usdc-logo.svg"} alt={swapDirection ? "VEX Token Logo" : "USDC Token Logo"} className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'VEX' : 'USDC'}</p>
          </div>
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={swapDirection ? vexAmount : usdcAmount}
          onChange={swapDirection ? handleVexAmountChange : handleUsdcAmountChange}
          className="token-input"
        />
      </div>

      <div className="token-box">
        <div className="token-info">
          <img src={swapDirection ? "/icons/usdc-logo.svg" : "/icons/g12.svg"} alt={swapDirection ? "USDC Token Logo" : "VEX Token Logo"} className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'USDC' : 'VEX'}</p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Equivalent"
          value={swapDirection ? displayUsdcAmount : vexAmount}
          readOnly
          className="token-input"
        />
      </div>

      <button className="swap-button" onClick={handleSwap}>Swap {swapDirection ? 'VEX to USDC' : 'USDC to VEX'}</button>
    
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
