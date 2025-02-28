import * as React from "react";
import { DropdownMenu } from "radix-ui";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import GiftModal from "./GiftModal";
import { LogOut, Gift, Settings, Coins } from "lucide-react";

const UserDropdown = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const { web3auth } = useWeb3Auth();
  const { accountId } = useGlobalContext();

  // Format account ID if too long
  const displayAccountId =
    accountId && accountId.length > 16
      ? `${accountId.slice(0, 8)}...${accountId.slice(-8)}`
      : accountId;

  // Handle keyboard navigation
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if dropdown is open AND click is outside both the dropdown and the button
      if (
        open && 
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target) && 
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    // Add listener to document
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      link: "/user",
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
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            ref={buttonRef}
            className="IconButton"
            aria-label="User menu"
            onClick={(e) => {
              e.stopPropagation();
              // Toggle dropdown
              setOpen((prev) => !prev);
            }}
          >
            <div className="user-avatar">
              <img src="/icons/user.png" alt="User icon" />
              {open && <div className="avatar-ring"></div>}
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            ref={dropdownRef}
            className="DropdownMenuContent"
            sideOffset={5}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-profile-header">
              <div className="user-avatar-large">
                <img src="/icons/user.png" alt="user icon" />
              </div>
              <div className="user-info">
                <span className="user-account-id">{displayAccountId}</span>
                <span className="user-wallet-type">
                  {web3auth?.connected ? "Web3Auth" : "NEAR Wallet"}
                </span>
              </div>
            </div>

            <DropdownMenu.Separator className="DropdownMenuSeparator" />

            <div className="menu-items-container">
              {menuItems.map((item) => (
                <React.Fragment key={item.id}>
                  {item.link ? (
                    <Link
                      href={item.link}
                      passHref
                      style={{
                        display: "block",
                        width: "100%",
                        color: "white",
                        textDecoration: "none",
                      }}
                    >
                      <DropdownMenu.Item
                        className={`DropdownMenuItem ${
                          activeItem === item.id ? "active" : ""
                        } ${item.danger ? "danger-item" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                        }}
                        onMouseEnter={() => setActiveItem(item.id)}
                        onMouseLeave={() => setActiveItem(null)}
                        onKeyDown={(e) => handleKeyDown(e, item.action)}
                      >
                        <div className="menu-item-content">
                          <div className="menu-item-icon">
                            <item.icon size={16} />
                          </div>
                          <span className="menu-item-label">{item.label}</span>
                        </div>
                      </DropdownMenu.Item>
                    </Link>
                  ) : (
                    <DropdownMenu.Item
                      className={`DropdownMenuItem ${
                        activeItem === item.id ? "active" : ""
                      } ${item.danger ? "danger-item" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        item.action();
                      }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setActiveItem(item.id)}
                      onMouseLeave={() => setActiveItem(null)}
                      onKeyDown={(e) => handleKeyDown(e, item.action)}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-icon">
                          <item.icon size={16} />
                        </div>
                        <span className="menu-item-label">{item.label}</span>
                      </div>
                    </DropdownMenu.Item>
                  )}

                  {item.id !== "logout" && (
                    <DropdownMenu.Separator className="DropdownMenuSeparator" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <GiftModal open={giftModalOpen} setIsOpen={setGiftModalOpen} />
    </>
  );
};

export default UserDropdown;
