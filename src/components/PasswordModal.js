// PasswordModal.js
import React, { useState } from 'react';

/**
 * PasswordModal component
 * 
 * This component renders a modal for entering a password when required.
 * 
 * @param {Object} props - The component props
 * @param {Function} props.onClose - Function to handle closing the modal
 * @param {Function} props.onSubmit - Function to handle submitting the password
 * 
 * @returns {JSX.Element} The rendered PasswordModal component
 */
const PasswordModal = ({ onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(password);
    setPassword(''); // Clear password after submitting
    onClose(); // Close the modal
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Enter Password</h2>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Password"
        />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PasswordModal;
