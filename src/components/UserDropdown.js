import * as React from "react";
import { DropdownMenu } from "radix-ui";
import Link from "next/link";
import { useState } from "react";
import { useNear } from "@/app/context/NearContext";

const UserDropdown = ({ onLogout }) => {
  const nearContext = useNear();
  const [open, setOpen] = useState(false);
  const isVexLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("isVexLogin") === "true";
  const accountId = isVexLogin
    ? localStorage.getItem("vexAccountId")
    : nearContext?.signedAccountId || null;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="IconButton" aria-label="Customise options">
          <img src="/icons/user.png" alt="User icon" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="DropdownMenuContent" sideOffset={5}>
          <DropdownMenu.Item className="DropdownMenuItem">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "5px",
                fontSize: "16px",
              }}
            >
              <img
                src="/icons/user.png"
                alt="User icon"
                style={{ width: "20px" }}
              />
              {accountId}
            </div>
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
          <DropdownMenu.Item className="DropdownMenuItem">
            <button>Gift USDC/VEX</button>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="DropdownMenuSeparator" />
          <DropdownMenu.Item className="DropdownMenuItem">
            <button onClick={onLogout}>Logout</button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default UserDropdown;
