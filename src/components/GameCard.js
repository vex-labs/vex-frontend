import React, { useState, useEffect } from 'react';
import { providers } from 'near-api-js';
import { placeBet } from '@/app/context/placebet';

const GameCard = ({ className, tournamentIcon, tournamentName, matchTime, team1Logo, team1Name, team2Logo, team2Name, odds1, odds2, matchId, walletBalance, wallet }) => {
  const [isBettingMode, setIsBettingMode] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [updatedOdds1, setUpdatedOdds1] = useState(odds1);
  const [updatedOdds2, setUpdatedOdds2] = useState(odds2);
  const [stake, setStake] = useState('');
  const [message, setMessage] = useState('Potential payout: $0.00');

  const fetchMatchDetails = async () => {
    try {
      const contractId = "sexyvexycontract.testnet";

      // Connect to NEAR blockchain
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

      // Fetch match details using the match_id
      const args = JSON.stringify({ match_id: matchId });
      const matchDetails = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_match",
        args_base64: Buffer.from(args).toString('base64'),
        finality: "final"
      });

      // Decode and parse the result
      const decodedResult = JSON.parse(Buffer.from(matchDetails.result).toString());

      console.log("Match Details:", decodedResult);

      // Update odds with the fetched data
      setUpdatedOdds1(decodedResult.team_1_odds);
      setUpdatedOdds2(decodedResult.team_2_odds);
    } catch (error) {
      console.error("Failed to fetch match details:", error);
    }
  };

  const fetchPotentialWinnings = async () => {
    try {
      if (!stake || parseFloat(stake) <= 0) {
        setMessage("Invalid stake amount");
        return;
      }

      const contractId = "shocking-desire.testnet";
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

      const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e24)).toString(); 

      const args = JSON.stringify({
        match_id: matchId,
        team: selectedBet === team1Name ? 'Team1' : 'Team2', 
        bet_amount: betAmount
      });

      const potentialWinnings = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_potential_winnings",
        args_base64: Buffer.from(args).toString('base64'),
        finality: "final"
      });

      const winnings = JSON.parse(Buffer.from(potentialWinnings.result).toString());
      setMessage(`Potential payout: $${winnings}`);
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
    if (!wallet) {
      setMessage("Wallet not initialized");
      return;
    }

    if (parseFloat(stake) <= 0 || parseFloat(stake) > parseFloat(walletBalance)) {
      setMessage("Invalid stake amount or insufficient funds.");
      return;
    }

    const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e24)).toString();

    try {
      await placeBet(wallet, matchId, selectedBet === team1Name ? 'Team1' : 'Team2', betAmount);
      setMessage("Bet placed successfully!");
    } catch (error) {
      console.error("Failed to place bet:", error);
      setMessage("Failed to place bet.");
    }
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
    setStake('');
    setMessage('Potential payout: $0.00');
  };

  return (
    <div className={`${className} ${isBettingMode ? 'betting-container' : ''}`}>
      {isBettingMode ? (
        <>
          <div className="back-arrow">
            <button onClick={handleBackClick}>&larr;</button>
          </div>
          <div className="teams">
            <div className="team-container" style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div className="team-bm">
                <img src={team1Logo} alt={team1Name} className="team-logo" />
                <span className="team-name">{team1Name}</span>
              </div>
            </div>
            <div className="vs">VS</div>
            <div className="team-container" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="team-bm">
                <span className="team-name">{team2Name}</span>
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
              <button onClick={handlePlaceBet} disabled={parseFloat(stake) > parseFloat(walletBalance)}>Bet</button>
            </div>
          </div>
          <div className="message">
            {message}
          </div>
        </>
      ) : (
        <>
          <div className="match-header">
            <div className="match-info">
              <img src={tournamentIcon} alt="Tournament" className="tournament-icon" />
              <span>{tournamentName}</span>
            </div>
            <div className="match-time">
              <span>{matchTime}</span>
            </div>
          </div>
          <div className="match-body">
            <div className="team">
              <img src={team1Logo} alt={team1Name} className="team-logo" />
              <span className="team-name">{team1Name}</span>
            </div>
            <div className="vs">
              <span>VS</span>
            </div>
            <div className="team">
              <img src={team2Logo} alt={team2Name} className="team-logo" />
              <span className="team-name">{team2Name}</span>
            </div>
          </div>
          <div className="match-odds">
            <div className="odds" onClick={() => handleOddsClick(team1Name)}>
              <span>{team1Name} Win </span>
              <span className="odds-value">{updatedOdds1}</span>
            </div>
            <div className="odds" onClick={() => handleOddsClick(team2Name)}>
              <span>{team2Name} Win</span>
              <span className="odds-value">{updatedOdds2}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GameCard;