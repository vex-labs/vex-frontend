import * as React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import GiftModal from "./GiftModal";
import { LogOut, Gift, Settings, Coins } from "lucide-react";
import "./UserDropdown.css";

const UserDropdown = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const { accountId } = useGlobalContext();

  // Handle keyboard navigation
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const formatAccountId = (accountId) => {
    return accountId.replace(".users.betvex.testnet", "");
  };

  const displayAccountId = accountId
    ? formatAccountId(accountId).length > 20
      ? `${formatAccountId(accountId).slice(0, 8)}...${formatAccountId(
          accountId
        ).slice(-8)}`
      : formatAccountId(accountId)
    : "";
    
  // Handle global click events to close the dropdown
  useEffect(() => {
    function handleClickAway(event) {
      // If the dropdown is open and the click is outside dropdown and button
      if (
        open && 
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target) && 
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    
    // Add event listeners
    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('touchend', handleClickAway);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('touchend', handleClickAway);
    };
  }, [open]);

  // Menu items configuration
  const menuItems = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      action: () => {
        setOpen(false);
      },
      link: "/settings",
    },
    {
      id: "bets",
      label: "View Bets",
      icon: Coins,
      action: () => {
        setOpen(false);
      },
      link: "/user",
    },
    {
      id: "gift",
      label: "Gift USDC/VEX",
      icon: Gift,
      action: () => {
        setGiftModalOpen(true);
        setOpen(false);
      },
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      action: onLogout,
      danger: true,
    },
  ];

  return (
    <>
      {/* Custom dropdown implementation - no Radix UI */}
      <div className="user-dropdown-container">
        <button
          ref={buttonRef}
          className="user-dropdown-button"
          aria-label="User menu"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <div className="user-avatar">
            <img src="/icons/user.png" alt="User icon" />
            {open && <div className="avatar-ring"></div>}
          </div>
        </button>
        
        {open && (
          <div 
            ref={dropdownRef}
            className="user-dropdown-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-profile-header">
              <div className="user-avatar-large">
                <img src="/icons/user.png" alt="user icon" />
              </div>
              <div className="user-info">
                <span className="user-account-id">{displayAccountId}</span>
                <span className="user-wallet-type"></span>
              </div>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="menu-items-container">
              {menuItems.map((item) => (
                <React.Fragment key={item.id}>
                  {item.link ? (
                    <Link
                      href={item.link}
                      style={{
                        display: "block",
                        width: "100%",
                        color: "white",
                        textDecoration: "none",
                      }}
                    >
                      <div
                        className={`dropdown-menu-item ${
                          activeItem === item.id ? "active" : ""
                        } ${item.danger ? "danger-item" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          item.action();
                        }}
                        onMouseEnter={() => setActiveItem(item.id)}
                        onMouseLeave={() => setActiveItem(null)}
                        onKeyDown={(e) => handleKeyDown(e, item.action)}
                        tabIndex={0}
                      >
                        <div className="menu-item-content">
                          <div className="menu-item-icon">
                            <item.icon size={16} />
                          </div>
                          <span className="menu-item-label">{item.label}</span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div
                      className={`dropdown-menu-item ${
                        activeItem === item.id ? "active" : ""
                      } ${item.danger ? "danger-item" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        item.action();
                      }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setActiveItem(item.id)}
                      onMouseLeave={() => setActiveItem(null)}
                      onKeyDown={(e) => handleKeyDown(e, item.action)}
                      tabIndex={0}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-icon">
                          <item.icon size={16} />
                        </div>
                        <span className="menu-item-label">{item.label}</span>
                      </div>
                    </div>
                  )}

                  {item.id !== "logout" && (
                    <div className="dropdown-divider"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <GiftModal open={giftModalOpen} setIsOpen={setGiftModalOpen} />
    </>
  );
};


export default UserDropdown;
