import React, { useState, useEffect } from 'react';
import { swapTokens } from '@/utils/swapTokens';
import { handleTransaction } from '@/utils/accountHandler';


const Swap = ({ signedAccountId, isVexLogin, wallet }) => {
  const [vexAmount, setVexAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState(true); // true = VEX -> USDC, false = USDC -> VEX
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  useEffect(() => {
    if (!password) {
      const savedPassword = localStorage.getItem("vexPassword");
      setPassword(savedPassword || ''); // Only set if it hasn't been set already
    }
  }, []);


  // Function for VEX-based swap
  const handleVexSwap = async () => {
    const tokenContractId = swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet';
    const receiverId = 'ref-finance-101.testnet';
    const poolId = 2197;

    const tokenAmount = swapDirection ? vexAmount : usdcAmount;

    if (!tokenAmount || isNaN(tokenAmount) || parseFloat(tokenAmount) <= 0) {
      alert('Invalid swap amount.');
      return;
    }

    if (!password) {
      setShowPasswordModal(true); // Prompt for password if not set
      return;
    }

    const formattedAmount = swapDirection
      ? (parseFloat(usdcAmount) * Math.pow(10, 6)).toFixed(0)
      : (parseFloat(vexAmount) * Math.pow(10, 18)).toFixed(0);

    try {
      const msg = JSON.stringify({
        force: 0,
        actions: [
          {
            pool_id: poolId,
            token_in: tokenContractId,
            token_out: swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet',
            amount_in: formattedAmount,
            amount_out: '0',
            min_amount_out: '0',
          }
        ]
      });

      const gas = '100000000000000';
      const deposit = '1';

      // Execute transaction using handleTransaction
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
        password // Pass the password here
      );

      console.log("VEX Swap Successful:", outcome);
      alert("VEX Swap Successful!");
      setPassword(null);
    } catch (error) {
      console.error("VEX Swap failed:", error);
      alert("VEX Swap Failed.");
    }
  };

  const handlePasswordSubmit = () => {
    setShowPasswordModal(false); // Close the modal
    handleVexSwap(); // Retry the swap with the entered password
  };

  // Handle the swap button click based on the login type
  const handleSwap = () => {
    console.log("Signed Account ID:", signedAccountId);
    console.log("Is VEX Login:", isVexLogin);
  
    if (signedAccountId) {
      handleNearSwap(); // Use NEAR wallet swap if logged in with NEAR
    } else if (isVexLogin) {
      handleVexSwap(); // Use VEX relayer-based swap if logged in with VEX
    } else {
      alert("Please log in first.");
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
          <img src={swapDirection ? "/icons/g12.svg" : "/icons/usdc-logo.svg"} alt="Token Logo" className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'VEX' : 'USDC'}</p>
            
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
          <img src={swapDirection ? "/icons/usdc-logo.svg" : "/icons/g12.svg"} alt="Token Logo" className="token-logo" />
          <div>
            <p className="token-name">{swapDirection ? 'USDC' : 'VEX'}</p>
            
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Password</h3>
            <input
              type="password"
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <button onClick={handlePasswordSubmit}>Submit</button>
            <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swap;
