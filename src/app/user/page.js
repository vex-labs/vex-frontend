"use client";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import "./user.css";
import { handleTransaction } from "@/utils/accountHandler";
import Sidebar2 from "@/components/Sidebar2";
import { useNear } from "@/app/context/NearContext";
import { NearRpcUrl, GuestbookNearContract } from "../config";
import UserBets from "@/components/Userbets";

const UserPage = () => {
  const nearContext = useNear();
  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";
  const accountId = isVexLogin
    ? localStorage.getItem("vexAccountId")
    : nearContext?.signedAccountId || null;
  const wallet = isVexLogin ? null : nearContext?.wallet || null;

  const [userBets, setUserBets] = useState([]);
  const [matchDetails, setMatchDetails] = useState({});
  const [matchStates, setMatchStates] = useState({});

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState("usdc.betvex.testnet");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  useEffect(() => {
    const fetchUserBets = async () => {
      try {
        const contractId = GuestbookNearContract;
        const args = {
          bettor: accountId,
          from_index: null,
          limit: null,
        };
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const userBets = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_users_bets",
          args_base64: btoa(JSON.stringify(args)),
          finality: "final",
        });
        const decodedResult = JSON.parse(
          Buffer.from(userBets.result).toString()
        );
        const userBetsWithState = decodedResult.map(([betId, bet]) => {
          const matchState = matchStates[bet.match_id]?.match_state || null; // Add match state if available
          return {
            betId,
            ...bet,
            match_state: matchState, // Include the match state
          };
        });

        setUserBets(userBetsWithState);
      } catch (error) {
        console.error("Failed to fetch user bets:", error);
      }
    };

    if (accountId) {
      fetchUserBets();
    }
  }, [accountId, matchStates]);

  // New useEffect hook to fetch matches and store match states by match_id
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const matches = await provider.query({
          request_type: "call_function",
          account_id: GuestbookNearContract,
          method_name: "get_matches",
          args_base64: btoa(JSON.stringify({ from_index: null, limit: null })),
          finality: "final",
        });
        const decodedResult = JSON.parse(
          Buffer.from(matches.result).toString()
        );

        const states = {};
        decodedResult.forEach((match) => {
          states[match.match_id] = { match_state: match.match_state };
        });

        setMatchStates(states);
        localStorage.setItem("matches", JSON.stringify(decodedResult));
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      }
    };

    fetchMatches();
  }, []);

  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    localStorage.setItem("vexPassword", enteredPassword);
    setShowPasswordModal(false);
    handleWithdrawFunds();
    localStorage.removeItem("vexPassword");
    setPassword(null);
  };

  const handleWithdrawFunds = async () => {
    if (!password) {
      setShowPasswordModal(true);
      return;
    }

    const decimals = withdrawToken === "token.betvex.testnet" ? 18 : 6;
    const formattedAmount = BigInt(
      parseFloat(withdrawAmount) * Math.pow(10, decimals)
    ).toString();
    const gas = "100000000000000"; // 100 TGas
    const deposit = "1"; // 1 yoctoNEAR

    try {
      const result = await handleTransaction(
        withdrawToken,
        "ft_transfer",
        { receiver_id: recipientAddress, amount: formattedAmount },
        gas,
        deposit,
        null,
        password
      );
      console.log("Withdrawal successful:", result);
      alert("Withdrawal Successful!");
      setShowWithdrawModal(false);
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal Failed.");
    }
  };

  if (!accountId) {
    return (
      <div className="user-page">
        <Sidebar2 />
        <div className="user-content">
          <h2
            style={{
              textAlign: "center",
              color: "var(--primary-color)",
              marginTop: "20%",
            }}
          >
            Please Login to access the user page
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page">
      <Sidebar2 />
      <div className="user-content">
        <UserBets
          userBets={userBets}
          wallet={wallet}
          signedAccountId={accountId}
        />

        {showWithdrawModal && (
          <div className="withdraw-modal">
            <div className="withdraw-modal-content">
              <h3>Withdraw Funds</h3>
              <label className="withdraw-label">
                Token:
                <select
                  value={withdrawToken}
                  onChange={(e) => setWithdrawToken(e.target.value)}
                  className="withdraw-select"
                >
                  <option value="usdc.betvex.testnet">USDC</option>
                  <option value="token.betvex.testnet">VEX</option>
                </select>
              </label>
              <label className="withdraw-label">
                Amount:
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="withdraw-input"
                />
              </label>
              <label className="withdraw-label">
                Recipient Address:
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter recipient address"
                  className="withdraw-input"
                />
              </label>
              <div className="withdraw-modal-buttons">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="withdraw-button cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawFunds}
                  className="withdraw-button confirm-button"
                >
                  {" "}
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Password</h3>
            <input
              type="password"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
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

export default UserPage;
