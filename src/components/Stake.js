import React, { useState, useEffect } from 'react';
import { providers } from 'near-api-js';
import { handleTransaction } from "@/utils/accountHandler";

const Staking = ({ wallet, signedAccountId, isVexLogin }) => {
  const [selectedOption, setSelectedOption] = useState('stake');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const hardcodedPassword = "shuban";

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = "sexyvexycontract.testnet";
  const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");


  const fetchBalance = async (accountId) => {
    try {
      console.log("Fetching balance for accountId:", accountId);
      const args = { account_id: accountId };
      console.log("Formatted args for fetchBalance:", args);

      const result = await provider.query({
        request_type: "call_function",
        account_id: tokenContractId,
        method_name: "ft_balance_of",
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: "final",
      });

      console.log("Raw result from fetchBalance:", result);
      const balanceValue = parseFloat(result) / 1e18;
      console.log("Parsed balanceValue:", balanceValue);
      setBalance(balanceValue); 
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchStakedBalance = async (accountId) => {
    try {
      console.log("Fetching staked balance for accountId:", accountId);
      const args = { account_id: accountId };
      console.log("Formatted args for fetchStakedBalance:", args);

      const result = await provider.query({
        request_type: "call_function",
        account_id: stakingContractId,
        method_name: "get_user_staked_bal",
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: "final",
      });

      console.log("Raw result from fetchStakedBalance:", result);
      const stakedBal = JSON.parse(Buffer.from(result.result).toString());
      console.log("Parsed stakedBal:", stakedBal);
      setStakedBalance(stakedBal / 1e18); 
    } catch (error) {
      console.error("Error fetching staked balance:", error);
    }
  };

  const fetchUserStakeInfo = async (accountId) => {
    try {
      console.log("Fetching user stake info for accountId:", accountId);
      const args = { account_id: accountId };
      console.log("Formatted args for fetchUserStakeInfo:", args);
  
      const result = await provider.query({
        request_type: "call_function",
        account_id: stakingContractId,
        method_name: "get_user_stake_info",
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: "final",
      });
  
      const stakeInfo = JSON.parse(Buffer.from(result.result).toString());
      console.log("User Stake Info:", stakeInfo);
    } catch (error) {
      console.error("Error fetching user stake info:", error);
    }
  };

  useEffect(() => {
    const initializeBalanceFetch = async () => {
      const accountId = wallet && signedAccountId ? signedAccountId : vexAccountId;
      if (accountId) {
        console.log("Using accountId:", accountId);
        await fetchBalance(accountId);
        await fetchStakedBalance(accountId);
        await fetchUserStakeInfo(accountId);
      }
    };

    initializeBalanceFetch();
  }, [signedAccountId, vexAccountId]);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    localStorage.setItem("vexPassword", enteredPassword);
    setShowPasswordModal(false);
  };

  const handleStake = async () => {
    if (!amount) {
      alert("Please enter an amount to stake.");
      return;
    }

    const formattedAmount = (parseFloat(amount) * Math.pow(10, 18)).toString();
    const msg = JSON.stringify({ action: 'AddUSDC' });
    const gas = "100000000000000";
    const deposit = "1";

    try {
      if (isVexLogin) {
        console.log("Staking with VEX login...");

        const transferResult = await handleTransaction(
          tokenContractId,
          "ft_transfer_call",
          {
            receiver_id: stakingContractId,
            amount: formattedAmount,
            msg: msg,
          },
          gas,
          deposit,
          hardcodedPassword
        );

        console.log("ft_transfer_call result for staking:", transferResult);

        if (transferResult && !transferResult.error) {
          const stakeAllResult = await handleTransaction(
            stakingContractId,
            "stake_all",
            {},
            gas,
            deposit,
            hardcodedPassword
          );
          console.log("Stake all completed successfully with VEX login!", stakeAllResult);
        }
      } else {
        console.log("Staking with NEAR wallet...");
        const transferResult = await wallet.callMethod({
          contractId: tokenContractId,
          method: "ft_transfer_call",
          args: {
            receiver_id: stakingContractId,
            amount: formattedAmount,
            msg: msg,
          },
          gas,
          deposit,
        });

        console.log("ft_transfer_call result for staking with NEAR wallet:", transferResult);

        if (transferResult && !transferResult.error) {
          const stakeAllResult = await wallet.callMethod({
            contractId: stakingContractId,
            method: "stake_all",
            args: {},
            gas,
            deposit,
          });
          console.log("Stake all completed successfully with NEAR wallet!", stakeAllResult);
        }
      }
    } catch (error) {
      console.error('Error during staking process:', error);
    }
  };

  const handleUnstake = async () => {
    if (!amount) {
      alert("Please enter an amount to unstake.");
      return;
    }

    const formattedAmount = (parseFloat(amount) * Math.pow(10, 18)).toString();
    const gas = "100000000000000";
    const deposit = "1";

    try {
      if (isVexLogin) {
        console.log("Unstaking with VEX login...");

        const unstakeResult = await handleTransaction(
          stakingContractId,
          "unstake",
          { amount: formattedAmount },
          gas,
          deposit,
          hardcodedPassword
        );

        console.log("Unstake result with VEX login:", unstakeResult);

        if (unstakeResult && !unstakeResult.error) {
          const withdrawResult = await handleTransaction(
            stakingContractId,
            "withdraw_all",
            {},
            gas,
            deposit,
            hardcodedPassword
          );
          console.log("Withdraw all completed successfully with VEX login!", withdrawResult);
        }
      } else {
        console.log("Unstaking with NEAR wallet...");

        const unstakeResult = await wallet.callMethod({
          contractId: stakingContractId,
          method: "unstake",
          args: { amount: formattedAmount },
          gas,
          deposit,
        });

        console.log("Unstake result with NEAR wallet:", unstakeResult);

        if (unstakeResult && !unstakeResult.error) {
          const withdrawResult = await wallet.callMethod({
            contractId: stakingContractId,
            method: "withdraw_all",
            args: {},
            gas,
            deposit,
          });
          console.log("Withdraw all completed successfully with NEAR wallet!", withdrawResult);
        }
      }
    } catch (error) {
      console.error('Error during unstaking process:', error);
    }
  };


  return (
    <div className="staking-container">
      <button className="confirm-button">
        Redistribute rewards
      </button>
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

      <div className="staking-statistics">
        <p>Your Balance: {balance} VEX</p>
        <p>Your Staked Balance: {stakedBalance} VEX</p>
      </div>

      <div className="token-box">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="token-input"
        />
      </div>

      <button className="confirm-button" onClick={selectedOption === 'stake' ? handleStake : handleUnstake}>
        Confirm {selectedOption}
      </button>


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

export default Staking;
