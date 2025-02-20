import * as React from "react";
import { DropdownMenu } from "radix-ui";
import Link from "next/link";
import { useState } from "react";
import { useNear } from "@/app/context/NearContext";
import GiftModal from "./GiftModal";
import { useGlobalContext } from "../app/context/GlobalContext";
import DepositModal from "./DepositModal";
import { useEffect } from "react";

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

const MobileMenuDropdown = ({ isLoggedIn, onLogout }) => {
  const { tokenBalances, toggleRefreshBalances } = useGlobalContext();

  useEffect(() => {
    toggleRefreshBalances();
  }, []);
  const nearContext = useNear();
  const [open, setOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";
  const accountId = isVexLogin
    ? localStorage.getItem("vexAccountId")
    : nearContext?.signedAccountId || null;

  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="white"
              class="bi bi-list"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="DropdownMenuContent" sideOffset={5}>
            <DropdownMenu.Item className="DropdownMenuItem">
              {Object.keys(tokenBalances).length > 0 ? (
                Object.entries(tokenBalances).map(([token, balance]) => (
                  <div
                    key={token}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "white",
                      fontSize: "16px",
                    }}
                  >
                    <img
                      src={`/icons/${token}.svg`}
                      alt={`${token} icon`}
                      className="token-icon"
                    />
                    {token}:{balance}
                  </div>
                ))
              ) : (
                <span>Balance: Loading...</span>
              )}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="DropdownMenuSeparator" />
            <DropdownMenu.Item className="DropdownMenuItem">
              <button>Learn</button>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="DropdownMenuItem">
              {isLoggedIn && <DepositModal />}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="DropdownMenuSeparator" />
            <Link href="/user" legacyBehavior style={{ width: "100%" }}>
              <DropdownMenu.Item
                className="DropdownMenuItem"
                onClick={() => setOpen(false)}
                style={{ cursor: "pointer" }}
              >
                <button>Settings</button>
              </DropdownMenu.Item>
            </Link>
            <DropdownMenu.Item className="DropdownMenuItem">
              <button>Withdraw</button>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="DropdownMenuSeparator" />
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onClick={() => setGiftModalOpen(true)}
            >
              <button>Gift USDC/VEX</button>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="DropdownMenuSeparator" />
            <DropdownMenu.Item className="DropdownMenuItem">
              <button onClick={onLogout}>Logout</button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <GiftModal open={giftModalOpen} setIsOpen={setGiftModalOpen} />
    </>
  );
};

export default MobileMenuDropdown;
