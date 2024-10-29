import React, { useState, useEffect } from 'react';
import { providers } from 'near-api-js';
import { handleTransaction } from "@/utils/accountHandler";
import { useGlobalContext } from '@/app/context/GlobalContext';

const Staking = ({ wallet, signedAccountId, isVexLogin }) => {
  const [selectedOption, setSelectedOption] = useState('stake');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [totalUSDCRewards, setTotalUSDCRewards] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshBalances, setRefreshBalances] = useState(false);

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = "sexyvexycontract.testnet";
  const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    setBalance(tokenBalances.VEX); // Update balance from context if tokenBalances changes
  }, [tokenBalances]);

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  useEffect(() => {
    if (isVexLogin) {
      const storedVexAccountId = localStorage.getItem("vexAccountId");
      if (storedVexAccountId) {
        setVexAccountId(storedVexAccountId);
        console.log("vexAccountId set from localStorage:", storedVexAccountId); // Log for confirmation
      } else {
        console.log("vexAccountId not found in localStorage.");
      }
    }
  }, [isVexLogin]);
  

  useEffect(() => {

    const accountId = signedAccountId || vexAccountId;
    
    if (accountId) {
      fetchStakedBalance(accountId)
      rewards_ready_to_swap(stakingContractId)
    } else {
      console.log("Account ID is null; fetch functions not called.");
    }
  }, [signedAccountId, vexAccountId, refreshBalances]);
  
  const handlePercentageClick = (percentage) => {
    const currentBalance = selectedOption === 'stake' ? balance : stakedBalance;
    setAmount((currentBalance * percentage).toFixed(2));
  };

  const fetchBalance = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString('base64');
  
      const result = await provider.query({
        request_type: "call_function",
        account_id: tokenContractId,
        method_name: "ft_balance_of",
        args_base64: encodedArgs,
        finality: "final",
      });
  
      const resultString = Buffer.from(result.result).toString();
      const parsedResult = JSON.parse(resultString);
      const balanceRaw = parseFloat(parsedResult) / 1e18;
  
      setBalance(isNaN(balanceRaw) ? 0 : parseFloat(balanceRaw.toFixed(2))); // Round to 2 decimal places
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };
  
  const fetchStakedBalance = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString('base64');
      const result = await provider.query({
        request_type: "call_function",
        account_id: stakingContractId,
        method_name: "get_user_staked_bal",
        args_base64: encodedArgs,
        finality: "final",
      });
  
      const resultString = Buffer.from(result.result).toString();
      // Parse as JSON to access U128 structure
      const parsedResult = JSON.parse(resultString);
      const stakedBalanceRaw = parseFloat(parsedResult) / 1e18;
      
  
      setStakedBalance(isNaN(stakedBalanceRaw) ? 0 : stakedBalanceRaw);
    } catch (error) {
      console.error("Error fetching staked balance:", error);
    }
  };

  const rewards_ready_to_swap = async () => {
    try {
      // Call the view function `get_usdc_staking_rewards` on the contract
      const result = await provider.query({
        request_type: "call_function",
        account_id: "sexyvexycontract.testnet",
        method_name: "get_usdc_staking_rewards",
        args_base64: "", // No arguments are required
        finality: "final",
      });

      // Parse the response and convert to the correct format (assuming 6 decimals for USDC)
      const parsedResult = JSON.parse(Buffer.from(result.result).toString());
      const totalUSDCRewardsToSwap = parseFloat(parsedResult) / 1e6;

      if (totalUSDCRewardsToSwap > 0) {
        setTotalUSDCRewards(totalUSDCRewardsToSwap);
      } 
    } catch (error) {
      console.error("Failed to retrieve USDC rewards to swap:", error);
      setTotalUSDCRewards(0); // Set to 0 or null if retrieval fails
    }
  };

  // Fetch rewards on component mount or as needed
  useEffect(() => {
    rewards_ready_to_swap();
  }, []);
  
  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    localStorage.setItem("vexPassword", enteredPassword);
    setShowPasswordModal(false);
    if (selectedOption === 'stake') {
      handleStake();
    } else {
      handleUnstake();
    }
    localStorage.removeItem('vexPassword');
    setPassword(null);
  };

  const handleStake = async () => {
    if (!amount) {
        setMessage("Please enter an amount to stake.");
        return;
    }

    if (isVexLogin && !password) {
        setShowPasswordModal(true);
        return;
    }

    const formattedAmount = (BigInt(parseFloat(amount) * 1e18)).toString();
    const msg = JSON.stringify("Stake");
    const gas = "100000000000000";
    const deposit = "0";
    const deposit1 = "1";

    try {
        if (parseFloat(amount) < 50) {
            setMessage("Minimum of 50 VEX is required to register in the contract.");
            return;
        }

        if (isVexLogin) {
            const depositResult = await handleTransaction(
                tokenContractId,
                "ft_transfer_call",
                { receiver_id: stakingContractId, amount: formattedAmount, msg },
                gas,
                deposit1,
                null,
                password
            );

            if (depositResult && !depositResult.error) {
                console.log("Deposit successful. Proceeding to stake.");
                const stakeResult = await handleTransaction(
                    stakingContractId,
                    "stake",
                    { amount: formattedAmount },
                    gas,
                    deposit,
                    null,
                    password
                );

                if (stakeResult && !stakeResult.error) {
                    setMessage("Stake transaction successful.");
                    setRefreshBalances((prev) => !prev); // Trigger balance refresh
                    toggleRefreshBalances();
                } else {
                    setMessage("Failed to stake. Please try again.");
                    console.error("Stake transaction failed:", stakeResult.error);
                }
            } else {
                setMessage("Failed to deposit. Please try again.");
                console.error("Deposit transaction failed:", depositResult.error);
            }
        } else {
            const depositResult = await wallet.callMethod({
                contractId: tokenContractId,
                method: "ft_transfer_call",
                args: { receiver_id: stakingContractId, amount: formattedAmount, msg: "Deposit" },
                gas,
                deposit1,
            });

            if (depositResult && !depositResult.error) {
                console.log("Deposit successful. Proceeding to stake.");

                const stakeResult = await wallet.callMethod({
                    contractId: stakingContractId,
                    method: "stake",
                    args: { amount: formattedAmount },
                    gas,
                    deposit,
                });

                if (stakeResult && !stakeResult.error) {
                    setMessage("Stake successful!");
                    setRefreshBalances((prev) => !prev); // Trigger balance refresh
                    toggleRefreshBalances();
                } else {
                    setMessage("Failed to stake. Please try again.");
                    console.error("Stake transaction failed:", stakeResult.error);
                }
            } else {
                setMessage("Failed to deposit. Please try again.");
                console.error("Deposit transaction failed:", depositResult.error);
            }
        }
    } catch (error) {
        setMessage("An error occurred during the staking process.");
        console.error("Error during deposit and stake process:", error);
    }
};


const handleUnstake = async () => {
  if (!amount) {
      setMessage("Please enter an amount to unstake.");
      return;
  }

  if (isVexLogin && !password) {
      setShowPasswordModal(true);
      return;
  }

  const formattedAmount = (BigInt(parseFloat(amount) * 1e18)).toString();
  const gas = "100000000000000";
  const deposit = "0";

  try {
      if (isVexLogin) {
          const unstakeResult = await handleTransaction(
              stakingContractId,
              "unstake",
              { amount: formattedAmount },
              gas,
              deposit,
              null,
              password
          );

          if (unstakeResult && !unstakeResult.error) {
              setMessage("Unstake transaction successful. Proceeding to withdraw.");

              const withdrawResult = await handleTransaction(
                  stakingContractId,
                  "withdraw_all",
                  {},
                  gas,
                  deposit,
                  null,
                  password
              );

              if (withdrawResult && !withdrawResult.error) {
                  setMessage("Withdraw transaction successful.");
                  setRefreshBalances((prev) => !prev); // Trigger balance refresh
                  toggleRefreshBalances();
                } else {
                  setMessage("Withdraw transaction failed. Please try again.");
                  console.error("Withdraw transaction failed:", withdrawResult.error);
              }
          } else {
              setMessage("Failed to unstake. Please try again.");
              console.error("Unstake transaction failed:", unstakeResult.error);
          }
      } else {
          const unstakeResult = await wallet.callMethod({
              contractId: stakingContractId,
              method: "unstake",
              args: { amount: formattedAmount },
              gas,
              deposit,
          });

          if (unstakeResult && !unstakeResult.error) {
              setMessage("Unstake transaction successful. Proceeding to withdraw.");

              const withdrawResult = await wallet.callMethod({
                  contractId: stakingContractId,
                  method: "withdraw_all",
                  args: {},
                  gas,
                  deposit,
              });

              if (withdrawResult && !withdrawResult.error) {
                  setMessage("Withdraw successful!");
                  setRefreshBalances((prev) => !prev); // Trigger balance refresh
                  toggleRefreshBalances();
                } else {
                  setMessage("Withdraw failed. Please try again.");
                  console.error("Failed to withdraw:", withdrawResult.error);
              }
          } else {
              setMessage("Failed to unstake. Please try again.");
              console.error("Unstake transaction failed:", unstakeResult.error);
          }
      }
  } catch (error) {
      setMessage("An error occurred during the unstaking process.");
      console.error("Error during unstaking process:", error);
  }
};



return (
    <div className="staking-container">
      <div className="staking-header">
    <div className="radio_container">
        <input
            type="radio"
            id="stake"
            value="stake"
            checked={selectedOption === 'stake'}
            onChange={() => setSelectedOption('stake')}
        />
        <label htmlFor="stake">Stake</label>

        <input
            type="radio"
            id="unstake"
            value="unstake"
            checked={selectedOption === 'unstake'}
            onChange={() => setSelectedOption('unstake')}
        />
        <label htmlFor="unstake">Unstake</label>
    </div>
</div>

<button className="confirm-button">
        Distribute rweards 
      </button>

      <div className="staking-statistics">
        <p>Your Balance: {balance} VEX</p>
        <p>Your Staked Balance: {stakedBalance} VEX</p>
        <p> USDC rewards: {totalUSDCRewards} USDC</p>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img src={"/icons/g12.svg"} alt={"VEX Token Logo"} className="token-logo" />
          <div>
            <p className="token-name">VEX</p>
          </div>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="token-input"
        />
      </div>

      <div className="balance-info">
        <span className="balance">Balance: {selectedOption === 'stake' ? balance : stakedBalance} VEX</span>
        <div className="percentage-options">
          <span onClick={() => handlePercentageClick(0.25)}>25%</span>
          <span onClick={() => handlePercentageClick(0.5)}>50%</span>
          <span onClick={() => handlePercentageClick(0.75)}>75%</span>
          <span onClick={() => handlePercentageClick(1)}>100%</span>
        </div>
      </div>

      <div className="message-box">{message}</div>

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
              placeholder=""
            />
            <div className="modal-buttons">
              <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button onClick={handlePasswordSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Staking;
