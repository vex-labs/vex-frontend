import React, { useState, useEffect } from 'react';

const Staking = ({ wallet, signedAccountId }) => {
  const [selectedOption, setSelectedOption] = useState('stake');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = "sexyvexycontract.testnet";

  // Fetch user's VEX balance
const fetchBalance = async () => {
  if (!wallet || !signedAccountId) return;
  try {
    const result = await wallet.account().viewFunction(
      'token.betvex.testnet',
      'ft_balance_of',
      { account_id: signedAccountId }
    );
    setBalance(result / 1e18); // assuming 18 decimals
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
};

// Fetch user's staked balance
const fetchStakedBalance = async () => {
  if (!wallet || !signedAccountId) return;
  try {
    const result = await wallet.account().viewFunction(
      'contract.betvex.testnet',
      'get_user_staked_bal',
      { account_id: signedAccountId }
    );
    setStakedBalance(result / 1e18); // assuming 18 decimals
  } catch (error) {
    console.error('Error fetching staked balance:', error);
  }
};


  useEffect(() => {
    fetchBalance();
    fetchStakedBalance();
  }, [signedAccountId]);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleStake = async () => {
    if (!wallet || !amount) return;
    try {
      // Prepare the message for the staking
      const msg = JSON.stringify({ action: 'AddUSDC' });

      console.log("Initiating staking...");

      // Call ft_transfer_call on the token contract for staking
      const outcome = await wallet.callMethod({
        contractId: tokenContractId,
        method: "ft_transfer_call",
        args: {
          receiver_id: stakingContractId, // The staking contract that will handle ft_on_transfer
          amount: (amount * 1e18).toString(), // The amount of tokens to transfer
          msg: msg, // The message to pass to the staking contract
        },
        gas: "100000000000000", // 100 Tgas
        deposit: "1", // 1 yoctoNEAR
      });

      console.log("Staking successful!", outcome);

      // After transfer is successful, call stake_all
      await wallet.callMethod({
        contractId: stakingContractId,
        method: "stake_all",
        args: {},
        gas: "100000000000000", // 100 Tgas
        deposit: "1", // 1 yoctoNEAR
      });

      console.log("Stake all completed successfully");
    } catch (error) {
      console.error('Error staking:', error.message || error);
    }
  };

  const handleUnstake = async () => {
    if (!wallet || !amount) return;
    try {
      console.log("Initiating unstaking...");

      // Call unstake on the staking contract
      await wallet.callMethod({
        contractId: stakingContractId,
        method: "unstake",
        args: {
          amount: (amount * 1e18).toString(),
        },
        gas: "100000000000000", // 100 Tgas
        deposit: "1", // 1 yoctoNEAR
      });

      console.log("Unstaking successful!");

      // After unstaking is successful, call withdraw_all
      await wallet.callMethod({
        contractId: stakingContractId,
        method: "withdraw_all",
        args: {},
        gas: "100000000000000", // 100 Tgas
        deposit: "1", // 1 yoctoNEAR
      });

      console.log("Withdraw all completed successfully");
    } catch (error) {
      console.error('Error unstaking:', error.message || error);
    }
  };

  const handleStakeAll = () => {
    setAmount(balance); // Set the input box to user's VEX balance
  };

  const handleUnstakeAll = () => {
    setAmount(stakedBalance); // Set the input box to user's staked balance
  };

  return (
    <div className="staking-container">
      <div className="staking-header">
        <label>
          <input
            type="radio"
            value="stake"
            checked={selectedOption === 'stake'}
            onChange={handleOptionChange}
          />
          Stake
        </label>
        <label>
          <input
            type="radio"
            value="unstake"
            checked={selectedOption === 'unstake'}
            onChange={handleOptionChange}
          />
          Unstake
        </label>
      </div>

      {/* Display user's current balance and staked balance */}
      <div className="staking-statistics">
        <p>Your Balance: {balance} VEX</p>
        <p>Your Staked Balance: {stakedBalance} VEX</p>
      </div>

      {/* VEX Token Input */}
      <div className="token-box">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="token-input"
        />
      </div>

      {/* Balance Info with buttons */}
      <div className="balance-info">
        <button onClick={handleStakeAll}>Stake All</button>
        <button onClick={handleUnstakeAll}>Unstake All</button>
      </div>

      {/* Confirm Button */}
      <button className="confirm-button" onClick={selectedOption === 'stake' ? handleStake : handleUnstake}>
        Confirm {selectedOption}
      </button>
    </div>
  );
};

export default Staking;
