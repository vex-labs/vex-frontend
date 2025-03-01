"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { LoginModal } from "./LoginModal";
import { CreateAccountModal } from "./CreateAccountModal";
import UserDropdown from "./UserDropdown";
import DepositModal from "./DepositModal";
import { useGlobalContext } from "../app/context/GlobalContext";
import { LogIn } from "lucide-react";
import MobileNavbar from "./MobileNavigation";

/**
 * Enhanced NavBar component with integrated authentication
 *
 * @returns {JSX.Element} The rendered NavBar component
 */
const NavBar = () => {
  // Web3Auth context
  const {
    web3auth,
    loginWithProvider,
    logout: web3authLogout,
    accountId,
    setAccountId,
    keyPair,
    isFindingAccount,
  } = useWeb3Auth();

  // Near wallet context
  const { wallet, signedAccountId } = useNear();

  // Global context for token balances
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  // UI state
  const [activeLink, setActiveLink] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  const pathname = usePathname();

  // Check if user is logged in through any method
  const isLoggedIn =
    isClientLoaded && (web3auth?.connected || !!signedAccountId);

  // Set active link based on current path
  useEffect(() => {
    const path = pathname;
    if (path === "/") setActiveLink("betting");
    else if (path.includes("/earn")) setActiveLink("earn");
    else if (path.includes("/community")) setActiveLink("community");
    else if (path.includes("/leaderboard")) setActiveLink("leaderboard");
    else setActiveLink("");
  }, [pathname]);

  // Monitor scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30); // Increased threshold to account for banner
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check localStorage after component mounts on client
  useEffect(() => {
    setIsClientLoaded(true);

    // Refresh balance on component mount
    toggleRefreshBalances();
  }, []);

  // Check for existing accounts before showing modal
  useEffect(() => {
    if (
      !isFindingAccount &&
      isClientLoaded &&
      keyPair &&
      !accountId &&
      !signedAccountId
    ) {
      setIsCreateAccountModalOpen(true);
    } else {
      // Close the modal if any account exists
      setIsCreateAccountModalOpen(false);
    }
  }, [keyPair, accountId, signedAccountId, isClientLoaded, isFindingAccount]);

  // Handle login with Web3Auth provider
  const handleLoginWithProvider = async (provider, options) => {
    try {
      await loginWithProvider(provider, options);
      setIsLoginModalOpen(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Handle account creation
  const handleAccountCreated = (newAccountId) => {
    setAccountId(newAccountId);
    setIsCreateAccountModalOpen(false);
  };

  // Handle NEAR wallet login
  const handleNearLogin = () => {
    wallet?.signIn();
  };

  // Handle logout from all providers
  const handleLogout = async () => {
    if (web3auth?.connected) {
      await web3authLogout();
    }
    if (signedAccountId) {
      await wallet?.signOut();
      localStorage.removeItem("near_signed_account_id");
    }
  };

  // Format token balances with proper decimals
  const formatBalance = (balance) => {
    if (!balance) return "0.00";

    // Convert to number and format with 2 decimal places
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(2);
  };

  return (
    <>
      <div className="testnet-banner">
        <p>
          TESTNET ACCOUNT: All funds are for testing purposes only and have no
          real value
        </p>
      </div>
      <MobileNavbar
        isLoggedIn={isLoggedIn}
        walletBalance={tokenBalances}
        onLogout={handleLogout}
        onLogin={() => setIsLoginModalOpen(true)}
      />
      <nav
        className={`nav ${isScrolled ? "nav-scrolled" : ""}`}
        style={{ marginTop: "35px" }}
      >
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
                  href="/community"
                  className={`nav-link ${
                    activeLink === "community" ? "nav-link-active" : ""
                  }`}
                  onClick={() => setActiveLink("community")}
                >
                  Community
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
              {/* TODO: LEARN */}

              {/* <button className="nav-link-learn">
                <span>Learn</span>
              </button> */}

              {isLoggedIn && <DepositModal />}

              {isLoggedIn ? (
                <>
                  <div className="wallet-balance-container">
                    {Object.keys(tokenBalances).length > 0 ? (
                      <div className="token-list">
                        {Object.entries(tokenBalances).map(
                          ([token, balance]) => (
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
                          )
                        )}
                      </div>
                    ) : (
                      <div className="loading-balance">
                        <div className="loading-pulse"></div>
                        <span>Loading balance...</span>
                      </div>
                    )}
                  </div>

                  <UserDropdown onLogout={handleLogout} />
                </>
              ) : (
                <div className="auth-buttons">
                  {isClientLoaded && (
                    <button
                      className="login-button near-login"
                      onClick={() => setIsLoginModalOpen(true)}
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginWithProvider={handleLoginWithProvider}
        onNearLogin={handleNearLogin}
      />
      <CreateAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        onAccountCreated={handleAccountCreated}
      />
    </>
  );
};

export default NavBar;
