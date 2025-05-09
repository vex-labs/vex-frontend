import React, { useState } from "react";

/**
 * VexLoginPrompt component
 *
 * This component provides a login prompt for VEX users.
 * It allows users to enter their username and password, and optionally save the password.
 *
 * This component requires a close button
 *
 * @param {Object} props - The component props
 * @param {Function} props.onLoginSuccess - Function to handle successful login
 * @param {Function} props.handleVexLogin - Function to handle the VEX login process
 *
 * @returns {JSX.Element} The rendered VexLoginPrompt component
 */

const VexLoginPrompt = ({ onLoginSuccess, handleVexLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savePassword, setSavePassword] = useState(false);

  const handleLogin = async () => {
    try {
      await handleVexLogin(username, savePassword ? password : null);
      if (savePassword) localStorage.setItem("vexPassword", password);
      onLoginSuccess(`${username.toLowerCase()}.betvex.testnet`);
    } catch (error) {
      console.error("Failed to create VEX account:", error);
    }
  };

  return (
    <div className="vex-login-prompt">
      <h3>Login with VEX</h3>

      <label htmlFor="username">Username</label>
      <div className="username-input">
        <input
          id="username"
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label className="save-password">
        <input
          type="checkbox"
          checked={savePassword}
          onChange={(e) => setSavePassword(e.target.checked)}
        />
        Save password for transactions
      </label>
      <button onClick={handleLogin}>create account</button>
    </div>
  );
};

export default VexLoginPrompt;
