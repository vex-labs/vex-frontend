// src/app/stake/page.js
"use client";
import NavBar from '../../components/NavBar';
import "./earn.css";
import { useState, useEffect } from 'react';

const EarnPage = () => {
  const [poolData, setPoolData] = useState(null);

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const response = await fetch('/api/ref-pool');
        const data = await response.json();
        setPoolData(data);
      } catch (error) {
        console.error('Error fetching pool data:', error);
      }
    };

    fetchPoolData();
  }, []);

  return (
    <div className = 'earn-page'>
      <NavBar />
      <div className = 'hero-section'>

      </div>
      <div className="earn-container">
        <div className="swap-section">
          <h2>Token Swap</h2>
          {poolData ? (
            <div>
              {/* Display the pool data here */}
              <p>Pool ID: {poolData.pool_id}</p>
              {/* Add your swap widget/UI here */}
            </div>
          ) : (
            <p>Loading pool data...</p>
          )}
        </div>
        <div className="stake-section">
          <h2>Stake/Unstake</h2>
          {/* Add stake/unstake functionality here */}
        </div>
      </div>
      <div className="faq-section">
        <h2>FAQ</h2>
        {/* Add FAQ content here */}
      </div>
    </div>
  );
};

export default EarnPage;
