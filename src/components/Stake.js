import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { handleTransaction } from "@/utils/accountHandler";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, GuestbookNearContract } from "@/app/config";

/**
 * Staking component
 *
 * This component allows users to stake and unstake their tokens.
 * It displays the user's balance, staked balance, and total USDC rewards.
 * Users can select between staking and unstaking options, enter an amount, and submit transactions.
 *
 * @param {Object} props - The component props
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.signedAccountId - The signed-in user's account ID
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 *
 * @returns {JSX.Element} The rendered Staking component
 */

const Staking = ({ wallet, signedAccountId, isVexLogin }) => {
  const [selectedOption, setSelectedOption] = useState("stake");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [totalUSDCRewards, setTotalUSDCRewards] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshBalances, setRefreshBalances] = useState(false);

  const tokenContractId = "token.betvex.testnet";
  const stakingContractId = GuestbookNearContract;
  const provider = new providers.JsonRpcProvider(NearRpcUrl);

  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    setBalance(tokenBalances.VEX); // Update balance from context if tokenBalances changes
  }, [tokenBalances]);

  // Load saved password from local storage
  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  // Load saved VEX account ID from local storage
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

  // Fetch staked balance and rewards on component mount or as needed
  useEffect(() => {
    const accountId = signedAccountId || vexAccountId;

    if (accountId) {
      fetchStakedBalance(accountId);
      rewards_ready_to_swap(stakingContractId);
    } else {
      console.log("Account ID is null; fetch functions not called.");
    }
  }, [signedAccountId, vexAccountId, refreshBalances]);

  const handlePercentageClick = (percentage) => {
    const currentBalance = selectedOption === "stake" ? balance : stakedBalance;
    setAmount((currentBalance * percentage).toFixed(2));
  };

  // This function fetches the staked balance for the user
  const fetchStakedBalance = async (accountId) => {
    try {
      const args = { account_id: accountId };
      const encodedArgs = Buffer.from(JSON.stringify(args)).toString("base64");
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

  // This function fetches the total USDC rewards available to swap
  const rewards_ready_to_swap = async () => {
    try {
      // Call the view function `get_usdc_staking_rewards` on the contract
      const result = await provider.query({
        request_type: "call_function",
        account_id: GuestbookNearContract,
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

    // Trigger function based on selected option
    if (selectedOption === "stake") {
      handleStake();
    } else if (selectedOption === "unstake") {
      handleUnstake();
    } else if (selectedOption === "stakeSwap") {
      handleStakeSwap(); // Call stake swap after password is submitted
    }

    localStorage.removeItem("vexPassword");
    setPassword(null);
  };

  // This function stakes the user's tokens in the staking contract
  // This function makes two transactions: one to deposit the tokens and another to stake them
  // This function is dynamically called based on the login type and password availability
  const handleStake = async () => {
    if (!amount) {
      setMessage("Please enter an amount to stake.");
      return;
    }

    if (isVexLogin && !password) {
      setShowPasswordModal(true);
      return;
    }

    const formattedAmount = BigInt(parseFloat(amount) * 1e18).toString();
    const msg = JSON.stringify("Stake");
    const gas = "100000000000000";
    const deposit = "0";
    const deposit1 = "1";

    try {
      if (parseFloat(amount) < 50) {
        setMessage(
          "Minimum of 50 VEX is required to register in the contract."
        );
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
          args: {
            receiver_id: stakingContractId,
            amount: formattedAmount,
            msg: "Deposit",
          },
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

  // This function unstakes the user's tokens and withdraws them from the staking contract
  // This function makes two transactions: one to unstake the tokens and another to withdraw them
  // This function is dynamically called based on the login type and password availability
  const handleUnstake = async () => {
    if (!amount) {
      setMessage("Please enter an amount to unstake.");
      return;
    }

    if (isVexLogin && !password) {
      setShowPasswordModal(true);
      return;
    }

    const formattedAmount = BigInt(parseFloat(amount) * 1e18).toString();
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

  // This functions swaps the rewards from the staking contract to USDC and distributes them to the users
  // This function is used for the "Distribute Rewards" button
  const handleStakeSwap = async () => {
    if (isVexLogin && !password) {
      setSelectedOption("stakeSwap"); // Set option to track purpose
      setShowPasswordModal(true); // Show password modal if password is missing
      return;
    }

    const contractId = GuestbookNearContract;
    const gas = "300000000000000"; // 300 TGas

    try {
      if (isVexLogin) {
        const outcome = await handleTransaction(
          contractId,
          "perform_stake_swap",
          {}, // No arguments required
          gas,
          "0", // Minimal deposit in yoctoNEAR
          null,
          password
        );

        console.log("Stake swap successful!", outcome);
        setMessage("Rewards distributed successfully");
      } else if (wallet && wallet.selector) {
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "perform_stake_swap",
          args: {},
          gas,
          deposit: "1", // Minimal deposit in yoctoNEAR
        });

        console.log("Stake swap successful!", outcome);
        setMessage("Rewards distributed successfully!");
      } else {
        setMessage("Failed to distribute rewards. Please try again.");
      }
    } catch (error) {
      console.error("Failed to perform stake swap:", error.message || error);
      setMessage("Failed to distribute rewars, please try again.");
    }
  };

  return (
    <div className="staking-container">
      <button className="confirm-button first" onClick={handleStakeSwap}>
        Distribute Rewards
      </button>

      <div className="staking-header">
        <div className="radio_container">
          <input
            type="radio"
            id="stake"
            value="stake"
            checked={selectedOption === "stake"}
            onChange={() => setSelectedOption("stake")}
          />
          <label htmlFor="stake">Stake</label>

          <input
            type="radio"
            id="unstake"
            value="unstake"
            checked={selectedOption === "unstake"}
            onChange={() => setSelectedOption("unstake")}
          />
          <label htmlFor="unstake">Unstake</label>
        </div>
      </div>

      <div className="staking-statistics">
        <div className="token-container">
          <h4 className="token-title">Your Balance: </h4>
          <p className="token-amount">{balance} VEX</p>
        </div>
        <div className="token-container">
          <h4 className="token-title">Your Staked Balance: </h4>
          <p className="token-amount">{stakedBalance} VEX</p>
        </div>
        <div className="token-container">
          <h4 className="token-title">USDC rewards: </h4>
          <p className="token-amount">
            {" "}
            <span className="usdc-amount">{totalUSDCRewards}</span> USDC
          </p>
        </div>
      </div>

      <div className="token-box">
        <div className="token-info">
          <img
            src={"/icons/g12.svg"}
            alt={"VEX Token Logo"}
            className="token-logo"
          />
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
        <span className="balance">
          Balance: {selectedOption === "stake" ? balance : stakedBalance} VEX
        </span>
        <div className="percentage-options">
          <span onClick={() => handlePercentageClick(0.25)}>25%</span>
          <span onClick={() => handlePercentageClick(0.5)}>50%</span>
          <span onClick={() => handlePercentageClick(0.75)}>75%</span>
          <span onClick={() => handlePercentageClick(1)}>100%</span>
        </div>
      </div>

      <div className="message-box">{message}</div>

      <button
        className="confirm-button"
        onClick={selectedOption === "stake" ? handleStake : handleUnstake}
      >
        Confirm {selectedOption}
      </button>

      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Password</h3>
            <input
              type="password"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
            />
            <div className="modal-buttons">
              <button onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button onClick={handlePasswordSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staking;
