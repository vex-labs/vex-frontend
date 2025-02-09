import React, { useState, useEffect } from "react";
import { providers } from "near-api-js";
import { placeBet } from "@/utils/placebet";
import { BetContractId, NearRpcUrl } from "@/app/config";

/**
 * GameCard component
 *
 * This component represents a card displaying information about a game match.
 * The game card can be in two modes: viewing the match details or placing a bet.
 * Betting mode will be replaced by a betslip.
 * It allows users to place bets on the match and view potential payouts.
 *
 * Note: For both functions "get_match" and "get_potential_winnings" different rpc calls are made to the contract.
 *
 * @param {Object} props - The component props
 * @param {string} props.className - Additional class names for styling
 * @param {string} props.tournamentIcon - URL of the tournament icon
 * @param {string} props.tournamentName - Name of the tournament
 * @param {string} props.matchTime - Time of the match
 * @param {string} props.team1Logo - URL of the first team's logo
 * @param {string} props.team1Name - Name of the first team
 * @param {string} props.team2Logo - URL of the second team's logo
 * @param {string} props.team2Name - Name of the second team
 * @param {number} props.odds1 - Betting odds for the first team
 * @param {number} props.odds2 - Betting odds for the second team
 * @param {string} props.matchId - ID of the match
 * @param {number} props.walletBalance - User's wallet balance
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.vexAccountId - User's VEX account ID
 *
 * @returns {JSX.Element} The rendered GameCard component
 */
const GameCard = ({
  className,
  tournamentIcon,
  tournamentName,
  matchTime,
  team1Logo,
  team1Name,
  team2Logo,
  team2Name,
  odds1,
  odds2,
  matchId,
  walletBalance,
  wallet,
  vexAccountId,
}) => {
  const [isBettingMode, setIsBettingMode] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [updatedOdds1, setUpdatedOdds1] = useState(odds1);
  const [updatedOdds2, setUpdatedOdds2] = useState(odds2);
  const [stake, setStake] = useState("");
  const [message, setMessage] = useState("Potential payout: $0.00");
  const [password, setPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) setPassword(savedPassword); // Set password from localStorage if available
  }, []);

  const fetchMatchDetails = async () => {
    try {
      const contractId = BetContractId;

      // Connect to NEAR blockchain
      const provider = new providers.JsonRpcProvider(NearRpcUrl);

      // Fetch match details using the match_id
      const args = JSON.stringify({ match_id: matchId });
      const matchDetails = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_match",
        args_base64: Buffer.from(args).toString("base64"),
        finality: "final",
      });

      // Decode and parse the result
      const decodedResult = JSON.parse(
        Buffer.from(matchDetails.result).toString(),
      );

      console.log("Match Details:", decodedResult);

      // Update odds with the fetched data
      setUpdatedOdds1(parseFloat(decodedResult.team_1_odds).toFixed(2));
      setUpdatedOdds2(parseFloat(decodedResult.team_2_odds).toFixed(2));
    } catch (error) {
      console.error("Failed to fetch match details:", error);
    }
  };

  const fetchPotentialWinnings = async () => {
    try {
      // Convert stake to a number first to avoid invalid inputs
      const stakeAmount = parseFloat(stake);

      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        setMessage("Invalid stake amount");
        return;
      }

      const contractId = BetContractId;
      const provider = new providers.JsonRpcProvider(NearRpcUrl);

      // Multiply the stake by 1e6 to match 6-decimal precision
      const betAmount = BigInt(Math.floor(stakeAmount * 1e6)).toString();

      const args = JSON.stringify({
        match_id: matchId,
        team: selectedBet === team1Name ? "Team1" : "Team2",
        bet_amount: betAmount,
      });

      const potentialWinnings = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_potential_winnings",
        args_base64: Buffer.from(args).toString("base64"),
        finality: "final",
      });

      // Decode the u128 response and convert back to USDC format
      const winningsRaw = BigInt(
        JSON.parse(Buffer.from(potentialWinnings.result).toString()),
      );
      const winningsUSDC = Number(winningsRaw) / 1e5;

      // Round to 2 decimal places for display in USDC
      const roundedWinnings = winningsUSDC.toFixed(2);

      setMessage(`Potential payout: $${roundedWinnings}`);
    } catch (error) {
      console.error("Failed to fetch potential winnings:", error);
      setMessage("Error calculating potential winnings.");
    }
  };

  const handleStakeChange = (e) => {
    const newStake = e.target.value;
    setStake(newStake);

    if (parseFloat(newStake) > parseFloat(walletBalance)) {
      setMessage("Insufficient funds");
    } else {
      fetchPotentialWinnings();
    }
  };

  const handlePlaceBet = async () => {
    if (!wallet && !vexAccountId) {
      setMessage("Wallet not initialized");
      return;
    }

    if (
      parseFloat(stake) <= 0 ||
      parseFloat(stake) > parseFloat(walletBalance)
    ) {
      setMessage("Invalid stake amount or insufficient funds.");
      return;
    }

    if (!password) {
      setShowPasswordModal(true); // Show modal if password is not set
      return;
    }

    const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e6)).toString();

    try {
      await placeBet(
        wallet,
        vexAccountId,
        matchId,
        selectedBet === team1Name ? "Team1" : "Team2",
        betAmount,
        password,
      );
      setMessage("Bet placed successfully!");
      setPassword(null); // Clear password after transaction
    } catch (error) {
      console.error("Failed to place bet:", error);
      setMessage("Failed to place bet.");
    }
  };

  const handlePasswordSubmit = () => {
    setShowPasswordModal(false); // Close the modal
    handlePlaceBet(); // Retry placing the bet
  };

  useEffect(() => {
    if (isBettingMode) {
      fetchMatchDetails();
    }
  }, [isBettingMode]);

  const handleOddsClick = (bet) => {
    setSelectedBet(bet);
    setIsBettingMode(true);
  };

  const handleBackClick = () => {
    setIsBettingMode(false);
    setSelectedBet(null);
    setStake("");
    setMessage("Potential payout: $0.00");
  };

  return (
    <div className={`${className} ${isBettingMode ? "betting-container" : ""}`}>
      {isBettingMode ? (
        <>
          <div className="back-arrow">
            <button onClick={handleBackClick}>&larr;</button>
          </div>
          <div className="teams">
            <div
              className="team-container"
              style={{ display: "flex", justifyContent: "flex-start" }}
            >
              <div className="team-bm">
                <img src={team1Logo} alt={team1Name} className="team-logo" />
                <span className="team-name">
                  {team1Name.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <div className="vs">VS</div>
            <div
              className="team-container"
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <div className="team-bm">
                <span className="team-name">
                  {team2Name.replace(/_/g, " ")}
                </span>
                <img src={team2Logo} alt={team2Name} className="team-logo" />
              </div>
            </div>
          </div>
          <div className="match-odds">
            <label className="odds">
              <input
                type="radio"
                name="bet"
                value={team1Name}
                checked={selectedBet === team1Name}
                onChange={() => setSelectedBet(team1Name)}
              />
              <span>{team1Name} Win</span>
              <span className="odds-value">{updatedOdds1}</span>
            </label>
            <label className="odds">
              <input
                type="radio"
                name="bet"
                value={team2Name}
                checked={selectedBet === team2Name}
                onChange={() => setSelectedBet(team2Name)}
              />
              <span>{team2Name} Win</span>
              <span className="odds-value">{updatedOdds2}</span>
            </label>
          </div>
          <div className="bet-input-container">
            <div className="stake-container">
              <input
                type="text"
                placeholder="Stake"
                value={stake}
                onChange={handleStakeChange}
              />
            </div>
            <div className="bet-button">
              <button
                onClick={handlePlaceBet}
                disabled={parseFloat(stake) > parseFloat(walletBalance)}
              >
                Bet
              </button>
            </div>
          </div>
          <div className="message">{message}</div>
        </>
      ) : (
        <>
          <div className="match-header">
            <div className="match-info">
              <img
                src={tournamentIcon}
                alt="Tournament"
                className="tournament-icon"
                style={{ marginRight: "8px" }}
              />
              <span>{tournamentName}</span>
            </div>
            <div className="match-time">
              <span>{matchTime}</span>
            </div>
          </div>
          <div className="match-body">
            <div className="team">
              <img src={team1Logo} alt={team1Name} className="team-logo" />
              <span className="team-name">{team1Name.replace(/_/g, " ")}</span>
            </div>
            <div className="vs">
              <span>VS</span>
            </div>
            <div className="team">
              <img src={team2Logo} alt={team2Name} className="team-logo" />
              <span className="team-name">{team2Name.replace(/_/g, " ")}</span>
            </div>
          </div>
          <div className="match-odds">
            <div className="odds" onClick={() => handleOddsClick(team1Name)}>
              <span>{team1Name.replace(/_/g, " ")} Win </span>
              <span className="odds-value">{updatedOdds1}</span>
            </div>
            <div className="odds" onClick={() => handleOddsClick(team2Name)}>
              <span>{team2Name.replace(/_/g, " ")} Win</span>
              <span className="odds-value">{updatedOdds2}</span>
            </div>
          </div>
        </>
      )}

      {/* Password Modal */}
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

export default GameCard;
