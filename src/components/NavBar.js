"use client";

import Link from "next/link";
import { useGlobalContext } from "../app/context/GlobalContext";

/**
 * NavBar component
 *
 * This is the Navbar that is rendered in every page
 * Navbar is dynamic and changes based on provided props
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isLoggedIn - Indicates if the user is logged in
 * @param {Function} props.onLogin - Function to handle user login
 * @param {Function} props.onLogout - Function to handle user logout
 * @param {Function} props.onVexLogin - Function to handle VEX login
 * @param {Function} props.onVexLogout - Function to handle VEX logout
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 *
 * @returns {JSX.Element} The rendered NavBar component
 */
const NavBar = ({
  isLoggedIn,
  onLogin,
  onLogout,
  onVexLogin,
  onVexLogout,
  isVexLogin,
}) => {
  const { tokenBalances } = useGlobalContext();

  return (
    <nav className="nav">
      <Link href="/" legacyBehavior>
        <a className="logo">
          <img
            src="/icons/NewPrimaryLogo.svg"
            alt="VEX"
            height="30.5"
            style={{ objectFit: "contain" }}
          />
        </a>
      </Link>
      <div className="nav-buttons">
        {isLoggedIn ? (
          <>
            {isVexLogin ? (
              <>
                <div className="wallet-balance">
                  {Object.keys(tokenBalances).length > 0 ? (
                    <ul>
                      {Object.entries(tokenBalances).map(([token, balance]) => (
                        <li key={token}>
                          <img
                            src={`/icons/${token}.svg`}
                            alt={`${token} icon`}
                            className="token-icon"
                          />
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
                  {Object.keys(tokenBalances).length > 0 ? (
                    <ul>
                      {/* Loop through tokenBalances and display each balance */}
                      {Object.entries(tokenBalances).map(([token, balance]) => (
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
