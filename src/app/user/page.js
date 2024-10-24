// UserPage.js
"use client";
import { useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import "./user.css";
import UserBets from '@/components/Userbets'; // Import the UserBets component

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
  const vexKeyPair = isVexLogin ? {
    publicKey: localStorage.getItem('vexPublicKey'),
    privateKey: localStorage.getItem('vexPrivateKey'),
  } : null;

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
    signedAccountId = vexKeyPair.publicKey;
  }

  const [userBets, setUserBets] = useState([]);

  useEffect(() => {
    const fetchUserBets = async () => {
      try {
        const contractId = "sexyvexycontract.testnet";

        // Setup the args with bettor, from_index and limit
        const args = {
          bettor: signedAccountId, // Use the user's signed account ID
          from_index: null, // Pass null or a specific index if needed
          limit: null, // Pass null or a specific limit if needed
        };

        const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
        const userBets = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_users_bets",
          args_base64: btoa(JSON.stringify(args)), // Convert args to base64-encoded JSON
          finality: "final",
        });

        // Log and parse the result
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

  return (
    <div className="user-page">
      <div className="user-content">
        {/* Account Details */}
        <section className="account-details">
          <h2>Account Details</h2>
          <div className="account-info">
            <p><strong>Username:</strong> {signedAccountId || "Not logged in"}</p>
            {/* VEX Buttons */}
            <section className="vex-section">
              <button className="vex-button">Withdraw Funds</button>
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
            <li>No past bets found.</li> {/* Placeholder content */}
          </ul>
        </section>

      </div>
    </div>
  );
};

export default UserPage;
