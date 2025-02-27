"use client";

import Link from "next/link";
import { useGlobalContext } from "../app/context/GlobalContext";
import UserDropdown from "./UserDropdown";
import DepositModal from "./DepositModal";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * NavBar component
 *
 * Enhanced navbar with improved UI/UX and responsive behavior
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
  const [activeLink, setActiveLink] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    if (path === "/") setActiveLink("betting");
    else if (path.includes("/earn")) setActiveLink("earn");
    else if (path.includes("/governance")) setActiveLink("governance");
    else if (path.includes("/leaderboard")) setActiveLink("leaderboard");
    else setActiveLink("");
  }, [pathname]);

  // Refresh balance on component mount
  useEffect(() => {
    toggleRefreshBalances();
  }, []);

  // Format token balances with proper decimals
  const formatBalance = (balance) => {
    if (!balance) return "0.00";

    // Convert to number and format with 2 decimal places
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(2);
  };

  return (
    <nav className={`nav ${isScrolled ? "nav-scrolled" : ""}`}>
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
            <div className="nav-links">
              <Link
                href="/"
                className={`nav-link ${
                  activeLink === "betting" ? "nav-link-active" : ""
                }`}
                onClick={() => setActiveLink("betting")}
              >
                Betting
              </Link>
              <Link
                href="/earn"
                className={`nav-link ${
                  activeLink === "earn" ? "nav-link-active" : ""
                }`}
                onClick={() => setActiveLink("earn")}
              >
                Earn
              </Link>
              <Link
                href="/governance"
                className={`nav-link ${
                  activeLink === "governance" ? "nav-link-active" : ""
                }`}
                onClick={() => setActiveLink("governance")}
              >
                Governance
              </Link>
              <Link
                href="/leaderboard"
                className={`nav-link ${
                  activeLink === "leaderboard" ? "nav-link-active" : ""
                }`}
                onClick={() => setActiveLink("leaderboard")}
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="nav-link-learn">
              <span>Learn</span>
            </button>

            {isLoggedIn && <DepositModal />}

            {isLoggedIn ? (
              <>
                <div className="wallet-balance-container">
                  {Object.keys(tokenBalances).length > 0 ? (
                    <div className="token-list">
                      {Object.entries(tokenBalances).map(([token, balance]) => (
                        <div key={token} className="token-item">
                          <img
                            src={`/icons/${token}.svg`}
                            alt={`${token} icon`}
                            className="token-icon"
                          />
                          <span className="token-balance">
                            {formatBalance(balance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="loading-balance">
                      <div className="loading-pulse"></div>
                      <span>Loading balance...</span>
                    </div>
                  )}
                </div>

                {isVexLogin ? (
                  <button onClick={onVexLogout} className="logout-button">
                    Log Out
                  </button>
                ) : (
                  <UserDropdown onLogout={onLogout} />
                )}
              </>
            ) : (
              <div className="auth-buttons">
                <button className="login-button near-login" onClick={onLogin}>
                  <img
                    src="/icons/NEAR.png"
                    alt="NEAR"
                    className="login-icon"
                  />
                  <span>NEAR Wallet</span>
                </button>
                {/* TODO: VEX LOGIN */}
                {/* <button className="login-button vex-login" onClick={onVexLogin}>
                  <img src="/icons/VEX.svg" alt="VEX" className="login-icon" />
                  <span>VEX Wallet</span>
                </button> */}
              </div>
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

        <div className="mobile-actions">
          {isLoggedIn && (
            <>
              <div className="mobile-balance">
                {Object.keys(tokenBalances).length > 0 &&
                  Object.entries(tokenBalances).map(([token, balance], index) =>
                    index === 0 ? (
                      <div key={token} className="token-item-mobile">
                        <img
                          src={`/icons/${token}.svg`}
                          alt={token}
                          className="token-icon-mobile"
                        />
                        <span>{formatBalance(balance)}</span>
                      </div>
                    ) : null
                  )}
              </div>
              <DepositModal />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
