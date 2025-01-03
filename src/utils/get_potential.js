import { providers } from 'near-api-js';
import { BetContractId, NearRpcUrl } from '../app/config';

/**
 * Fetches potential winnings for a bet on a specified match.
 * 
 * This function calculates the potential winnings for a bet placed on a specific match
 * by calling the `get_potential_winnings` method on the NEAR contract.
 * 
 * @param {string} matchId - The ID of the match to bet on
 * @param {string} selectedBet - The selected team to bet on
 * @param {string} team1Name - The name of the first team
 * @param {string} stake - The amount of the stake to bet
 * @param {function} setMessage - Function to set the message for the result or error
 * 
 * @returns {Promise<void>} A promise that resolves when the potential winnings are fetched
 */
const fetchPotentialWinnings = async (matchId, selectedBet, team1Name, stake, setMessage) => {
    try {
      if (!stake || parseFloat(stake) <= 0) {
        setMessage("Invalid stake amount");
        return;
      }

      const contractId = BetContractId;
      const provider = new providers.JsonRpcProvider(NearRpcUrl);

      const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e6)).toString(); 

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
