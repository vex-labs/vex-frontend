import { useState } from "react";

const FaucetSection = () => {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleFaucetClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Tokens received!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faucet-container">
      <h3>Get USDC from Faucet</h3>
      <input
        type="number"
        min="1"
        max="100"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (1-100)"
      />
      <button onClick={handleFaucetClick} disabled={loading}>
        {loading ? "Processing..." : "Request USDC"}
      </button>
    </div>
  );
};

export default FaucetSection;
