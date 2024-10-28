"use client";
import { useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import "./user.css";
import UserBets from '@/components/Userbets';
import { handleTransaction } from "@/utils/accountHandler"; 

// lacks password modal, does not fetch password, yet propts a security key

let useNear;
if (typeof window !== 'undefined') {
  try {
    useNear = require('@/app/context/NearContext').useNear;
  } catch (error) {
    console.warn("NearContext is not available:", error);
    useNear = null;
  }
}

const UserPage = () => {
  const isVexLogin = typeof window !== 'undefined' && localStorage.getItem('isVexLogin') === 'true';
  const accountId = isVexLogin ? localStorage.getItem("vexAccountId") : signedAccountId;

  let wallet = null;
  let signedAccountId = null;

  if (!isVexLogin && useNear) {
    try {
      const nearContext = useNear();
      wallet = nearContext?.wallet || null;
      signedAccountId = nearContext?.signedAccountId || null;
    } catch (error) {
      console.error("Error accessing NearContext:", error);
    }
  }

  if (isVexLogin) {
    signedAccountId = accountId;
  }

  const [userBets, setUserBets] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState("usdc.betvex.testnet"); // Default token
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  useEffect(() => {
    const fetchUserBets = async () => {
      try {
        const contractId = "sexyvexycontract.testnet";
        const args = {
          bettor: signedAccountId,
          from_index: null,
          limit: null,
        };
        const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
        const userBets = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_users_bets",
          args_base64: btoa(JSON.stringify(args)),
          finality: "final",
        });
        const decodedResult = JSON.parse(Buffer.from(userBets.result).toString());
        console.log("User Bets:", decodedResult);
        setUserBets(decodedResult);
      } catch (error) {
        console.error("Failed to fetch user bets:", error);
      }
    };

    if (signedAccountId) {
      fetchUserBets();
    }
  }, [signedAccountId]);

  // Handle the withdraw funds action
  const handleWithdrawFunds = async () => {
    const formattedAmount = (parseFloat(withdrawAmount) * Math.pow(10, 18)).toString(); // Assuming 18 decimals for VEX
    const gas = "100000000000000"; // 100 TGas
    const deposit = "1"; // 1 yoctoNEAR
    
    try {
      const result = await handleTransaction(
        withdrawToken,
        "transfer",
        { receiver_id: recipientAddress, amount: formattedAmount },
        gas,
        deposit,
        isVexLogin ? "hardcoded_password_value" : undefined
      );
      console.log("Withdrawal successful:", result);
      alert("Withdrawal Successful!");
      setShowWithdrawModal(false); // Close the modal on success
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal Failed.");
    }
  };

  return (
    <div className="user-page">
      <div className="user-content">
        {/* Account Details */}
        <section className="account-details">
          <h2>Account Details</h2>
          <div className="account-info">
            <p><strong>Username:</strong> {signedAccountId || "Not logged in"}</p>
            <section className="vex-section">
              <button className="vex-button" onClick={() => setShowWithdrawModal(true)}>Withdraw Funds</button>
              <button className="vex-button">Export Private Key</button>
            </section>
          </div>
        </section>

        {/* Tokens Section */}
        <section className="tokens-section">
          <div className="token-item">
            <h2>Token 1</h2>
            <p>Token 1 details</p>
          </div>
          <div className="token-item">
            <h2>Token 2</h2>
            <p>Token 2 details</p>
          </div>
        </section>

        {/* Active Bets */}
        <UserBets userBets={userBets} wallet={wallet} signedAccountId={signedAccountId} />

        {/* Past Bets */}
        <section className="past-bets">
          <h2>Past Bets</h2>
          <ul>
            <li>No past bets found.</li>
          </ul>
        </section>

        {/* Withdraw Funds Modal */}
        {showWithdrawModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Withdraw Funds</h3>
              <label>
                Token:
                <select value={withdrawToken} onChange={(e) => setWithdrawToken(e.target.value)}>
                  <option value="usdc.betvex.testnet">USDC</option>
                  <option value="token.betvex.testnet">VEX</option>
                </select>
              </label>
              <label>
                Amount:
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </label>
              <label>
                Recipient Address:
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter recipient address"
                />
              </label>
              <button onClick={handleWithdrawFunds}>Confirm Withdrawal</button>
              <button onClick={() => setShowWithdrawModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;