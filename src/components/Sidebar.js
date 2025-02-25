import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
} from "lucide-react";

/**
 * Enhanced Sidebar component
 * Features improved UI, animations, and organization
 *
 * @param {Object} props - The component props
 * @param {Function} props.onSelectGame - Function to handle game selection
 * @param {string} props.selectedGame - The currently selected game
 *
 * @returns {JSX.Element} The rendered Sidebar component
 */
const Sidebar = ({ onSelectGame, selectedGame }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGamesExpanded, setIsGamesExpanded] = useState(true);
  const [isSocialsExpanded, setIsSocialsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const pathname = usePathname();

  // Check if sidebar should be collapsed on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  // Main navigation items
  const mainNavItems = [
    {
      name: "home",
      label: "Home",
      path: "/",
      icon: <Home size={20} strokeWidth={1.5} />,
    },
    {
      name: "earn",
      label: "Earn",
      path: "/earn",
      icon: (
        <img src="/icons/staking.png" alt="earn" className="sidebar-icon" />
      ),
    },
    {
      name: "governance",
      label: "Governance",
      path: "/governance",
      icon: (
        <img
          src="/icons/governance.png"
          alt="Governance"
          className="sidebar-icon"
        />
      ),
    },
    {
      name: "leaderboard",
      label: "Leaderboard",
      path: "/leaderboard",
      icon: <BarChart3 size={20} strokeWidth={1.5} />,
    },
  ];

  // Games list
  const games = [
    {
      name: "counter-strike-2",
      label: "Counter Strike 2",
      icon: "/icons/games/csgo.png",
    },
    {
      name: "lol",
      label: "League of Legends",
      icon: "/icons/games/lol.png",
    },
    {
      name: "valorant",
      label: "Valorant",
      icon: "/icons/games/valorant.png",
    },
    {
      name: "fortnite",
      label: "Fortnite",
      icon: "/icons/games/fortnite.png",
    },
    {
      name: "apex",
      label: "Apex Legends",
      icon: "/icons/games/apex.png",
    },
    {
      name: "rainbowsix",
      label: "Rainbow Six Siege",
      icon: "/icons/games/rainbowsix.png",
    },
    {
      name: "dota2",
      label: "Dota 2",
      icon: "/icons/games/dota2.png",
    },
    {
      name: "overwatch-2",
      label: "Overwatch 2",
      icon: "/icons/games/overwatch.png",
    },
  ];

  // Social media links
  const socials = [
    {
      name: "Telegram",
      icon: "/icons/socials/telegram.png",
      link: "https://t.me/+4x6uwCjC7BgzNmRk",
    },
    {
      name: "X (Twitter)",
      icon: "/icons/socials/x.png",
      link: "https://x.com/betvex",
    },
    {
      name: "TikTok",
      icon: "/icons/socials/tiktok.png",
      link: "https://www.tiktok.com/@betvex",
    },
    {
      name: "Instagram",
      icon: "/icons/socials/instagram.png",
      link: "https://www.instagram.com/getvexy",
    },
  ];

  // Toggle specific section expansion
  const toggleSection = (section) => {
    switch (section) {
      case "games":
        setIsGamesExpanded(!isGamesExpanded);
        break;
      case "socials":
        setIsSocialsExpanded(!isSocialsExpanded);
        break;
      default:
        break;
    }
  };

  // Render a section header with expandable toggle
  const renderSectionHeader = (title, section, isExpanded) => (
    <div
      className={`sidebar-section-header ${isCollapsed ? "collapsed" : ""}`}
      onClick={() => !isCollapsed && toggleSection(section)}
      onMouseEnter={() => setHoveredItem(`section-${section}`)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <span className="section-title">{title}</span>
      {!isCollapsed && (
        <button
          className="section-toggle-button"
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list main-nav">
          {mainNavItems.map((item) => (
            <li
              key={item.name}
              className={`nav-item ${pathname === item.path ? "active" : ""}`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link href={item.path} className="nav-link">
                <span className="nav-icon">{item.icon}</span>
                {(!isCollapsed || hoveredItem === item.name) && (
                  <span className={`nav-label ${isCollapsed ? "tooltip" : ""}`}>
                    {item.label}
                  </span>
                )}
                {pathname === item.path && (
                  <span className="active-indicator" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Games Section */}
      <div className="sidebar-section">
        {renderSectionHeader("Games", "games", isGamesExpanded)}

        {(isGamesExpanded || isCollapsed) && (
          <ul
            className={`nav-list games-list ${
              !isGamesExpanded ? "hidden" : ""
            }`}
          >
            {games.map((game) => (
              <li
                key={game.name}
                className={`nav-item ${
                  selectedGame === game.name ? "active" : ""
                }`}
                onMouseEnter={() => setHoveredItem(`game-${game.name}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <a
                  href="#"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectGame(game.name);
                  }}
                >
                  <span className="nav-icon">
                    <img
                      src={game.icon}
                      alt={game.label}
                      className="game-icon"
                    />
                  </span>
                  {(!isCollapsed || hoveredItem === `game-${game.name}`) && (
                    <span
                      className={`nav-label ${isCollapsed ? "tooltip" : ""}`}
                    >
                      {game.label}
                    </span>
                  )}
                  {selectedGame === game.name && (
                    <span className="active-indicator" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Social Links Section */}
      <div className="sidebar-section">
        {renderSectionHeader("Socials", "socials", isSocialsExpanded)}

        {(isSocialsExpanded || isCollapsed) && (
          <ul
            className={`nav-list socials-list ${
              !isSocialsExpanded && !isCollapsed ? "hidden" : ""
            }`}
          >
            {socials.map((social) => (
              <li
                key={social.name}
                className="nav-item social-item"
                onMouseEnter={() => setHoveredItem(`social-${social.name}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <a
                  href={social.link}
                  className="nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="nav-icon">
                    <img
                      src={social.icon}
                      alt={social.name}
                      className="social-icon"
                    />
                  </span>
                  {(!isCollapsed ||
                    hoveredItem === `social-${social.name}`) && (
                    <span
                      className={`nav-label ${isCollapsed ? "tooltip" : ""}`}
                    >
                      <span>{social.name}</span>
                      <ExternalLink size={12} className="external-link-icon" />
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User Section */}
      <div className="sidebar-section user-section">
        {isCollapsed ? (
          <div className="sidebar-section-header collapsed">
            <span className="section-title">User</span>
          </div>
        ) : (
          <div className="sidebar-section-header">
            <span className="section-title">User Area</span>
          </div>
        )}

        <ul className="nav-list">
          <li
            className={`nav-item ${pathname === "/user" ? "active" : ""}`}
            onMouseEnter={() => setHoveredItem("user")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link href="/user" className="nav-link">
              <span className="nav-icon">
                <Users size={20} strokeWidth={1.5} />
              </span>
              {(!isCollapsed || hoveredItem === "user") && (
                <span className={`nav-label ${isCollapsed ? "tooltip" : ""}`}>
                  User Profile
                </span>
              )}
              {pathname === "/user" && <span className="active-indicator" />}
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
