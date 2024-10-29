"use client";

import Link from 'next/link';

const NavBar = ({ isLoggedIn, walletBalance, onLogin, onLogout, onVexLogin, onVexLogout, isVexLogin }) => {
  return (
    <nav className="nav">
      <Link href="/" legacyBehavior>
        <a className="logo">
          <img src="/icons/NewPrimaryLogo.svg" alt="VEX" height="30.5" style={{ objectFit: "contain" }} />
        </a>
      </Link>
      <div className="nav-buttons">
        {isLoggedIn ? (
          <>
            {isVexLogin ? (
              <>
                <div className="wallet-balance">
                  {Object.keys(walletBalance).length > 0 ? (
                    <ul>
                      {Object.entries(walletBalance).map(([token, balance]) => (
                        <li key={token}>
                          <img src={`/icons/${token}.svg`} alt={`${token} icon`} className="token-icon" />
                          <span className="token-balance">{balance}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>Balance: Loading...</span>
                  )}
                </div>
                <button onClick={onVexLogout}>Log Out</button>
              </>
            ) : (
              <>
                <div className="wallet-balance">
                  {Object.keys(walletBalance).length > 0 ? (
                    <ul>
                      {/* Loop through tokenBalances and display each balance */}
                      {Object.entries(walletBalance).map(([token, balance]) => (
                        <li key={token}>
                          {token}: {balance}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>Balance: Loading...</span>
                  )}
                </div>
                <button onClick={onLogout}>Log Out</button>
              </>
            )}
          </>
        ) : (
          <>
            <button onClick={onLogin}>Log In with NEAR</button>
            <button onClick={onVexLogin}>Log In with VEX</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
