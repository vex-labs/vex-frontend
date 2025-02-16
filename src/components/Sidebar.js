import Link from "next/link";
import { lazy, useState } from "react";
/**
 * Sidebar component
 * Sidebar can toggle between collapsed and expanded states.
 * This sidebar is not dynamic and is only used in the main page
 * Sidebar2.js is used in the userpage and earn page
 *
 * @param {Object} props - The component props
 * @param {Function} props.onSelectGame - Function to handle game selection
 * @param {string} props.selectedGame - The currently selected game
 *
 * @returns {JSX.Element} The rendered Sidebar component
 */

const Sidebar = ({ onSelectGame, selectedGame }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsCollapsed(!isCollapsed);
      setIsTransitioning(false);
    }, 300);
  };

  const games = [
    {
      name: "counter-strike-2",
      label: "Counter Strike 2",
      icon: "/icons/games/csgo.png",
    },
    { name: "lol", label: "League of Legends", icon: "/icons/games/lol.png" },
    { name: "valorant", label: "Valorant", icon: "/icons/games/valorant.png" },
    { name: "fortnite", label: "Fortnite", icon: "/icons/games/fortnite.png" },
    { name: "apex", label: "Apex Legends", icon: "/icons/games/apex.png" },
    {
      name: "rainbowsix",
      label: "Rainbow Six Siege",
      icon: "/icons/games/rainbowsix.png",
    },
    { name: "dota2", label: "Dota 2", icon: "/icons/games/dota2.png" },
    {
      name: "overwatch-2",
      label: "Overwatch 2",
      icon: "/icons/games/overwatch.png",
    },
  ];

  const socials = [
    {
      name: "Telegram",
      icon: "/icons/socials/telegram.png",
      link: "https://t.me/+4x6uwCjC7BgzNmRk",
    },
    { name: "x", icon: "/icons/socials/x.png", link: "https://x.com/betvex" },
    {
      name: "TikTok",
      icon: "/icons/socials/tiktok.png",
      link: "https://www.tiktok.com/@betvex",
    },
    {
      name: "Instagram",
      icon: "/icons/socials/instagram.png",
      link: "https://www.instagram.com/getvexy?igsh=Nzl4cDIzbGZwNDR2&utm_source=qr",
    },
  ];

  return (
    <div
      className={`app-sidebar ${isCollapsed ? "collapsed" : ""} ${
        isTransitioning ? "transitioning" : ""
      }`}
    >
      <ul>
        <li>
          <button className="toggle-button" onClick={toggleSidebar}>
            {isCollapsed ? "→" : "←"}
          </button>
        </li>
        <li>
          <Link href="/" legacyBehavior>
            <a>
              <HomeIcon />
              {!isCollapsed && <span>Home</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/earn" legacyBehavior>
            <a>
              <img
                src="/icons/staking.png"
                alt="earn"
                style={{ width: "17px", height: "17px" }}
              />
              {!isCollapsed && <span>Earn</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/governance" legacyBehavior>
            <a>
              <img
                src="/icons/governance.png"
                alt="Governance"
                style={{ width: "17px", height: "17px" }}
              />
              {!isCollapsed && <span>Governance</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/leaderboard" legacyBehavior>
            <a>
              <ChartIcon />
              {!isCollapsed && <span>Leaderboard</span>}
            </a>
          </Link>
        </li>
      </ul>
      <div className={`section-title`}>Popular</div>
      <ul>
        {games.map((game) => (
          <li key={game.name}>
            <a
              href="#"
              onClick={() => onSelectGame(game.name)}
              className={game.name === selectedGame ? "selected" : ""}
            >
              <img src={game.icon} alt={game.label} />
              {!isCollapsed && <span>{game.label}</span>}
            </a>
          </li>
        ))}
      </ul>
      <div className={`section-title`}>Socials</div>
      <ul>
        {socials.map((social) => (
          <li key={social.name}>
            <a href={social.link} target="_blank" rel="noopener noreferrer">
              <img src={social.icon} alt={social.name} />
              {!isCollapsed && <span>{social.name}</span>}
            </a>
          </li>
        ))}
      </ul>
      <div className={`section-title`}>User Area</div>
      <ul>
        <li>
          <Link href="/user" legacyBehavior>
            <a>
              <img src="/icons/user.png" alt="User Area" />
              {!isCollapsed && <span>User Area</span>}
            </a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      class="lucide lucide-house"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
