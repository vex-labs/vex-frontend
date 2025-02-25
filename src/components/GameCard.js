import React, { useState, useEffect, useCallback } from "react";
import { providers } from "near-api-js";
import { placeBet } from "@/utils/placebet";
import { BetContractId, NearRpcUrl } from "@/app/config";
import { ArrowLeft, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { createPortal } from "react-dom";

const games = [
  {
    name: "counter-strike-2",
    label: "Counter Strike 2",
    icon: "/icons/games/csgo.png",
  },
  {
    name: "lol",
    label: "League of Legends",
    icon: "/icons/games/lol.png",
  },
  {
    name: "valorant",
    label: "Valorant",
    icon: "/icons/games/valorant.png",
  },
  {
    name: "fortnite",
    label: "Fortnite",
    icon: "/icons/games/fortnite.png",
  },
  {
    name: "apex",
    label: "Apex Legends",
    icon: "/icons/games/apex.png",
  },
  {
    name: "rainbowsix",
    label: "Rainbow Six Siege",
    icon: "/icons/games/rainbowsix.png",
  },
  {
    name: "dota2",
    label: "Dota 2",
    icon: "/icons/games/dota2.png",
  },
  {
    name: "overwatch-2",
    label: "Overwatch 2",
    icon: "/icons/games/overwatch.png",
  },
];

/**
 * Enhanced GameCard component
 *
 * This component represents a card displaying information about a game match with improved UI/UX.
 * It handles both viewing match details and placing bets with better error handling and visual feedback.
 *
 * @param {Object} props - The component props
 * @param {string} props.className - Additional class names for styling
 * @param {string} props.matchTime - Time of the match
 * @param {string} props.tournamentIcon - Tournament icon URL
 * @param {string} props.tournamentName - Tournament name
 * @param {string} props.team1Logo - URL of the first team's logo
 * @param {string} props.team1Name - Name of the first team
 * @param {string} props.team2Logo - URL of the second team's logo
 * @param {string} props.team2Name - Name of the second team
 * @param {string} props.matchId - ID of the match
 * @param {number} props.walletBalance - User's wallet balance
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.vexAccountId - User's VEX account ID
 *
 * @returns {JSX.Element} The rendered GameCard component
 */
const GameCard = ({
  className,
  matchTime,
  tournamentIcon,
  tournamentName,
  team1Logo,
  team1Name,
  team2Logo,
  team2Name,
  matchId,
  walletBalance = "0",
  wallet,
  vexAccountId,
}) => {
  // Component state
  const [isBettingMode, setIsBettingMode] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [updatedOdds1, setUpdatedOdds1] = useState("1.00");
  const [updatedOdds2, setUpdatedOdds2] = useState("1.00");
  const [stake, setStake] = useState("");
  const [message, setMessage] = useState({
    text: "Enter stake amount to see potential payout",
    type: "info",
  });
  const [password, setPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoadingOdds, setIsLoadingOdds] = useState(true);
  const [isCalculatingWinnings, setIsCalculatingWinnings] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);

  // Format team names for display
  const formatTeamName = (name) => {
    return name ? name.replace(/_/g, " ") : "Unknown Team";
  };

  // Handle password retrieval on component mount
  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword") || "";
    setPassword(savedPassword);
  }, []);

  // Fetch match details and odds from the blockchain
  const fetchMatchDetails = useCallback(async () => {
    setIsLoadingOdds(true);
    try {
      const contractId = BetContractId;
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
        Buffer.from(matchDetails.result).toString()
      );

      // Update odds with the fetched data
      setUpdatedOdds1(parseFloat(decodedResult.team_1_odds).toFixed(2));
      setUpdatedOdds2(parseFloat(decodedResult.team_2_odds).toFixed(2));
    } catch (error) {
      console.error("Failed to fetch match details:", error);
      setUpdatedOdds1("1.00");
      setUpdatedOdds2("1.00");
    } finally {
      setIsLoadingOdds(false);
    }
  }, [matchId]);

  // Calculate potential winnings based on stake and odds
  const fetchPotentialWinnings = async () => {
    if (!selectedBet || !stake) return;

    // Convert stake to a number first to avoid invalid inputs
    const stakeAmount = parseFloat(stake);

    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      setMessage({
        text: "Please enter a valid stake amount",
        type: "warning",
      });
      return;
    }

    if (stakeAmount > parseFloat(walletBalance || "0")) {
      setMessage({
        text: "Insufficient funds in your wallet",
        type: "error",
      });
      return;
    }

    setIsCalculatingWinnings(true);
    try {
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
        JSON.parse(Buffer.from(potentialWinnings.result).toString())
      );
      const winningsUSDC = Number(winningsRaw) / 1e5;

      // Round to 2 decimal places for display in USDC
      const roundedWinnings = winningsUSDC.toFixed(2);

      setMessage({
        text: `Potential payout: $${roundedWinnings} USDC`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to fetch potential winnings:", error);
      setMessage({
        text: "Error calculating potential winnings",
        type: "error",
      });
    } finally {
      setIsCalculatingWinnings(false);
    }
  };

  // Handle stake amount changes
  const handleStakeChange = (e) => {
    const newStake = e.target.value;
    setStake(newStake);

    if (newStake && selectedBet) {
      fetchPotentialWinnings();
    } else {
      setMessage({
        text: "Enter stake amount to see potential payout",
        type: "info",
      });
    }
  };

  // Handle placing a bet
  const handlePlaceBet = async () => {
    if (betSuccess) {
      // If bet was already successful, just return to view mode
      setIsBettingMode(false);
      setBetSuccess(false);
      return;
    }

    if (!wallet && !vexAccountId) {
      setMessage({
        text: "Wallet not initialized. Please connect your wallet first",
        type: "error",
      });
      return;
    }

    if (!selectedBet) {
      setMessage({
        text: "Please select a team to bet on",
        type: "warning",
      });
      return;
    }

    const stakeAmount = parseFloat(stake);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      setMessage({
        text: "Please enter a valid stake amount",
        type: "warning",
      });
      return;
    }

    if (stakeAmount > parseFloat(walletBalance || "0")) {
      setMessage({
        text: "Insufficient funds in your wallet",
        type: "error",
      });
      return;
    }

    if (!password) {
      setShowPasswordModal(true); // Show modal if password is not set
      return;
    }

    setIsPlacingBet(true);
    try {
      const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e6)).toString();

      await placeBet(
        matchId,
        selectedBet === team1Name ? "Team1" : "Team2",
        betAmount,
        BetContractId,
        "usdc.betvex.testnet",
        wallet,
        vexAccountId,
        password
      );

      setBetSuccess(true);
      setMessage({
        text: "Bet placed successfully! You can view your active bets in your profile",
        type: "success",
      });

      setPassword(null); // Clear password after transaction
    } catch (error) {
      console.error("Failed to place bet:", error);
      setMessage({
        text: error.message || "Failed to place bet. Please try again",
        type: "error",
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Handle password submission
  const handlePasswordSubmit = () => {
    if (!password) {
      return;
    }
    setShowPasswordModal(false);
    handlePlaceBet();
  };

  // Fetch match details on component mount
  useEffect(() => {
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  // Handle team selection for betting
  const handleOddsClick = (bet) => {
    if (!wallet && !vexAccountId) {
      console.log("No wallet or VEX account ID available");
      // If user is not logged in, we could show a login prompt
      return;
    }

    setSelectedBet(bet);
    setIsBettingMode(true);
    setMessage({
      text: "Enter stake amount to see potential payout",
      type: "info",
    });
  };

  // Return to match view mode
  const handleBackClick = () => {
    setIsBettingMode(false);
    setSelectedBet(null);
    setStake("");
    setBetSuccess(false);
    setMessage({
      text: "Enter stake amount to see potential payout",
      type: "info",
    });
  };

  // Get message styling based on message type
  const getMessageClass = () => {
    switch (message.type) {
      case "error":
        return "message-error";
      case "warning":
        return "message-warning";
      case "success":
        return "message-success";
      default:
        return "message-info";
    }
  };

  return (
    <div className={`${className} ${isBettingMode ? "betting-container" : ""}`}>
      {isBettingMode ? (
        // Betting Mode View
        <>
          <div className="back-arrow">
            <button
              onClick={handleBackClick}
              className="back-button"
              aria-label="Back to match details"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="match-time betting-match-time">
            <span>{matchTime}</span>
          </div>

          <div className="teams">
            <div className="team-container team1-container">
              <div className="team-bm">
                <img
                  src={team1Logo || "/icons/teams/default_team.png"}
                  alt={formatTeamName(team1Name)}
                  className="team-logo"
                  onError={(e) => {
                    e.target.src = "/icons/teams/default_team.png";
                  }}
                />
                <span className="team-name">{formatTeamName(team1Name)}</span>
              </div>
            </div>

            <div className="vs">VS</div>

            <div className="team-container team2-container">
              <div className="team-bm">
                <span className="team-name">{formatTeamName(team2Name)}</span>
                <img
                  src={team2Logo || "/icons/teams/default_team.png"}
                  alt={formatTeamName(team2Name)}
                  className="team-logo"
                  onError={(e) => {
                    e.target.src = "/icons/teams/default_team.png";
                  }}
                />
              </div>
            </div>
          </div>

          <div className="match-odds betting-odds">
            <label
              className={`odds ${
                selectedBet === team1Name ? "selected-odds" : ""
              }`}
            >
              <input
                type="radio"
                name="bet"
                value={team1Name}
                checked={selectedBet === team1Name}
                onChange={() => setSelectedBet(team1Name)}
              />
              <div className="odds-content">
                <span className="odds-team">
                  {formatTeamName(team1Name)} Win
                </span>
                <span className="odds-value">
                  {isLoadingOdds ? "..." : updatedOdds1}
                </span>
              </div>
            </label>

            <label
              className={`odds ${
                selectedBet === team2Name ? "selected-odds" : ""
              }`}
            >
              <input
                type="radio"
                name="bet"
                value={team2Name}
                checked={selectedBet === team2Name}
                onChange={() => setSelectedBet(team2Name)}
              />
              <div className="odds-content">
                <span className="odds-team">
                  {formatTeamName(team2Name)} Win
                </span>
                <span className="odds-value">
                  {isLoadingOdds ? "..." : updatedOdds2}
                </span>
              </div>
            </label>
          </div>

          {betSuccess ? (
            // Success view
            <div className="bet-success">
              <div className="success-icon">
                <CheckCircle size={40} />
              </div>
              <p className="success-message">Bet placed successfully!</p>
              <button className="done-button" onClick={handleBackClick}>
                Done
              </button>
            </div>
          ) : (
            // Bet input view
            <>
              <div className="bet-input-container">
                <div className="stake-container">
                  <div className="stake-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={stake}
                      onChange={handleStakeChange}
                      disabled={isPlacingBet}
                      className="stake-input"
                    />
                    <span className="currency-label">USDC</span>
                  </div>
                </div>

                <div className="bet-button">
                  <button
                    onClick={handlePlaceBet}
                    disabled={
                      !selectedBet ||
                      !stake ||
                      isPlacingBet ||
                      parseFloat(stake) > parseFloat(walletBalance || "0")
                    }
                    className={`place-bet-button ${
                      isPlacingBet ? "loading" : ""
                    }`}
                  >
                    {isPlacingBet ? "Processing..." : "Place Bet"}
                  </button>
                </div>
              </div>

              <div className={`message ${getMessageClass()}`}>
                {isCalculatingWinnings ? (
                  <div className="calculating">
                    Calculating potential winnings...
                  </div>
                ) : (
                  <div className="message-content">
                    <span className="message-icon">
                      {message.type === "error" && <AlertCircle size={16} />}
                      {message.type === "success" && <CheckCircle size={16} />}
                      {message.type === "info" && <DollarSign size={16} />}
                    </span>
                    <span>{message.text}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        // Match View Mode
        <>
          <div className="match-header">
            <div className="match-info">
              {games.find((game) => game.name === tournamentName) && (
                <img
                  src={games.find((game) => game.name === tournamentName)?.icon}
                  alt={tournamentName || "Tournament"}
                  className="tournament-icon"
                  onError={(e) => {
                    e.target.src = "/icons/events/default_tournament.png";
                  }}
                />
              )}
              {tournamentName && (
                <span className="tournament-name">
                  {games.find((game) => game.name === tournamentName)?.label}
                </span>
              )}
            </div>
            <div className="match-time">
              <span>{matchTime}</span>
            </div>
          </div>

          <div className="match-body">
            <div className="team">
              <img
                src={team1Logo || "/icons/teams/default_team.png"}
                alt={formatTeamName(team1Name)}
                className="team-logo"
                onError={(e) => {
                  e.target.src = "/icons/teams/default_team.png";
                }}
              />
              <span className="team-name">{formatTeamName(team1Name)}</span>
            </div>

            <div className="vs">
              <span>VS</span>
            </div>

            <div className="team">
              <img
                src={team2Logo || "/icons/teams/default_team.png"}
                alt={formatTeamName(team2Name)}
                className="team-logo"
                onError={(e) => {
                  e.target.src = "/icons/teams/default_team.png";
                }}
              />
              <span className="team-name">{formatTeamName(team2Name)}</span>
            </div>
          </div>

          <div className="match-odds">
            <div
              className={`odds ${isLoadingOdds ? "odds-loading" : ""}`}
              onClick={() => !isLoadingOdds && handleOddsClick(team1Name)}
            >
              <span className="odds-team">{formatTeamName(team1Name)} Win</span>
              <span className="odds-value">
                {isLoadingOdds ? "..." : updatedOdds1}
              </span>
            </div>

            <div
              className={`odds ${isLoadingOdds ? "odds-loading" : ""}`}
              onClick={() => !isLoadingOdds && handleOddsClick(team2Name)}
            >
              <span className="odds-team">{formatTeamName(team2Name)} Win</span>
              <span className="odds-value">
                {isLoadingOdds ? "..." : updatedOdds2}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Password Modal */}
      {showPasswordModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content">
              <h3>Enter Password</h3>
              <p className="modal-description">
                Please enter your wallet password to place the bet
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your wallet password"
                className="password-input"
              />
              <div className="modal-buttons">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="cancel-modal-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="submit-modal-button"
                  disabled={!password}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default GameCard;
