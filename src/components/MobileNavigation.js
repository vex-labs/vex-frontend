import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Book, FileUp, LogIn } from "lucide-react";
import UserDropdown from "./UserDropdown";
import DepositModal from "./DepositModal";
import { useNear } from "@/app/context/NearContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import "./MobileNavigation.css";

/**
 * MobileNavbar Component
 *
 * Mobile navigation bar that includes logo, menu toggle, and dropdown navigation
 * with user account management, login/logout, and access to modals.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isLoggedIn - Indicates if the user is logged in
 * @param {Function} props.onLogin - Function to handle user login
 * @param {Function} props.onLogout - Function to handle user logout
 *
 * @returns {JSX.Element} The MobileNavbar component
 */
const MobileNavbar = ({ isLoggedIn, onLogin, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Navigation links
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Earn", path: "/earn" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Governance Community", path: "/governance" },
    { name: "View Bets", path: "/user" },
  ];

  const handleDepositClick = () => {
    setIsMenuOpen(false);
    setIsDepositModalOpen(true);
  };

  return (
    <>
      <div className="mob-navbar">
        <div className="mob-navbar__container">
          <Link href="/" className="mob-navbar__logo">
            <img src="/icons/NewPrimaryLogo.svg" alt="BetVEX" />
          </Link>

          <div className="mob-navbar__actions">
            {isLoggedIn && (
              <div className="mob-navbar__user">
                <UserDropdown onLogout={onLogout} />
              </div>
            )}

            <button
              className="mob-navbar__menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Full screen menu overlay */}
        <div
          className={`mob-navbar__menu ${
            isMenuOpen ? "mob-navbar__menu--open" : ""
          }`}
        >
          <div className="mob-navbar__menu-content">
            {/* Navigation Links */}
            <nav className="mob-navbar__nav">
              <ul className="mob-navbar__nav-list">
                {navLinks.map((link) => (
                  <li key={link.name} className="mob-navbar__nav-item">
                    <Link
                      href={link.path}
                      className={`mob-navbar__nav-link ${
                        pathname === link.path
                          ? "mob-navbar__nav-link--active"
                          : ""
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Action Buttons */}
            <div className="mob-navbar__actions-group">
              {/* TODO: LEARN */}
              {/* <button
                className="mob-navbar__action-button mob-navbar__learn-button"
                onClick={() => window.open("https://docs.betvex.io", "_blank")}
              >
                <Book size={18} />
                <span>Learn</span>
              </button> */}

              {isLoggedIn && (
                <button
                  className="mob-navbar__action-button mob-navbar__deposit-button"
                  onClick={() => handleDepositClick()}
                >
                  <FileUp size={18} />
                  <span>Deposit</span>
                </button>
              )}
            </div>

            {/* Login/Logout Section */}
            {!isLoggedIn ? (
              <div className="mob-navbar__auth">
                <button
                  className="mob-navbar__auth-button mob-navbar__near-login"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogin();
                  }}
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
              </div>
            ) : (
              <div className="mob-navbar__auth">
                <button
                  className="mob-navbar__auth-button mob-navbar__logout"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <DepositModal
          modalOpen={isDepositModalOpen}
          setModalOpen={setIsDepositModalOpen}
          modalOnly={true}
        />
      )}
    </>
  );
};

export default MobileNavbar;
