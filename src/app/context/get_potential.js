const fetchPotentialWinnings = async () => {
    try {
      if (!stake || parseFloat(stake) <= 0) {
        setMessage("Invalid stake amount");
        return;
      }

      const contractId = "shocking-desire.testnet";
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

      // Convert stake to yoctoNEAR (assuming NEAR input)
      const betAmount = BigInt(Math.floor(parseFloat(stake) * 1e24)).toString(); // Convert to BigInt and then to string

      const args = JSON.stringify({
        match_id: matchId,
        team: selectedBet === team1Name ? 'Team1' : 'Team2', // Assuming team names map to Team1 and Team2 in the contract
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
