import React, { useState } from "react";

const VexLoginPrompt = ({ onLoginSuccess, handleVexLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savePassword, setSavePassword] = useState(false);

  const handleLogin = async () => {
    try {
      await handleVexLogin(username, savePassword ? password : null);
      if (savePassword) localStorage.setItem("vexPassword", password);
      onLoginSuccess(`${username.toLowerCase()}.testnet`);
    } catch (error) {
      console.error("Failed to create VEX account:", error);
    }
  };

  return (
    <div className="vex-login-prompt">
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={savePassword}
          onChange={(e) => setSavePassword(e.target.checked)}
        />
        Save password for transactions
      </label>
      <button onClick={handleLogin}>Login with VEX</button>
    </div>
  );
};

export default VexLoginPrompt;
