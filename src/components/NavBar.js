"use client";

import Link from "next/link";
import { useGlobalContext } from "../app/context/GlobalContext";
import UserDropdown from "./UserDropdown";
import DepositModal from "./DepositModal";
import { useEffect } from "react";
import MobileMenuDropdown from "./MobileMenuDropdown";

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
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    toggleRefreshBalances();
  }, []);

  return (
    <nav className="nav">
      <div className="desktop-nav">
        <div className="desktop-nav-content">
          <div className="left-container">
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
            <div>
              <Link className="nav-link" href="/">
                Betting
              </Link>
              <Link className="nav-link" href="/earn">
                Earn
              </Link>
              <Link className="nav-link" href="/governance">
                Governance
              </Link>
              <Link className="nav-link" href="/leaderboard">
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="nav-buttons">
            <button className="nav-link-learn">Learn</button>
            {isLoggedIn && <DepositModal />}
            {isLoggedIn ? (
              <>
                {isVexLogin ? (
                  <>
                    <div className="wallet-balance">
                      {Object.keys(tokenBalances).length > 0 ? (
                        <ul>
                          {Object.entries(tokenBalances).map(
                            ([token, balance]) => (
                              <li key={token}>
                                <img
                                  src={`/icons/${token}.svg`}
                                  alt={`${token} icon`}
                                  className="token-icon"
                                />
                                <span className="token-balance">{balance}</span>
                              </li>
                            )
                          )}
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
                          {Object.entries(tokenBalances).map(
                            ([token, balance]) => (
                              <li key={token}>
                                <img
                                  src={`/icons/${token}.svg`}
                                  alt={`${token} icon`}
                                  className="token-icon"
                                />
                                {token}: {balance}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <span>Balance: Loading...</span>
                      )}
                    </div>
                    <div className="dropdown">
                      <UserDropdown onLogout={onLogout} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <button className="nav-link" onClick={onLogin}>
                  Log In with NEAR
                </button>
                <button className="nav-link" onClick={onVexLogin}>
                  Log In with VEX
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mobile-nav">
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
        <MobileMenuDropdown
          onLogout={onLogout}
          onLogin={onLogin}
          isLoggedIn={isLoggedIn}
          isVexLogin={isVexLogin}
          onVexLogin={onVexLogin}
        />
      </div>
    </nav>
  );
};

export default NavBar;
