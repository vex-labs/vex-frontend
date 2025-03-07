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
  Coins,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { games } from "@/data/games";
import { socials } from "@/data/socials";
import { useTour } from "@reactour/tour";

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
  const [hideGames, setHideGames] = useState(true);
  const [isSocialsExpanded, setIsSocialsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hideCollapseButton, setHideCollapseButton] = useState(false);
  const { currentStep, setCurrentStep } = useTour();

  const pathname = usePathname();

  // Check if sidebar should be collapsed on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setHideCollapseButton(true);
        setIsCollapsed(true);
      } else {
        setHideCollapseButton(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Main navigation items
  const mainNavItems = [
    {
      name: "home",
      label: "Betting",
      path: "/",
      icon: <Home size={20} strokeWidth={1.5} />,
    },
    {
      name: "earn",
      label: "Earn",
      path: "/earn",
      icon: (
        <img src="/icons/staking.png" alt="earn" className="app-sidebar-icon" />
      ),
    },
    {
      name: "community",
      label: "Community",
      path: "/community",
      icon: (
        <img
          src="/icons/governance.png"
          alt="Governance"
          className="app-sidebar-icon"
        />
      ),
    },
    {
      name: "leaderboard",
      label: "Leaderboard",
      path: "/leaderboard",
      icon: <BarChart3 size={20} strokeWidth={1.5} />,
    },
    {
      name: "bets",
      label: "View Bets",
      path: "/user",
      icon: <Coins size={20} strokeWidth={1.5} />,
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
      className={`app-sidebar-section-header ${isCollapsed ? "collapsed" : ""}`}
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

  const gamesToShow = hideGames ? games.slice(0, 5) : games;

  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle Button */}
      <button
        className="app-sidebar-toggle"
        style={{
          display: hideCollapseButton ? "none" : "",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Main Navigation */}
      <nav className="app-sidebar-nav">
        <ul className="nav-list main-nav">
          {mainNavItems.map((item) => (
            <li
              key={item.name}
              className={`nav-item ${pathname === item.path ? "active" : ""} ${
                item.name
              }`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                if (item.name === "bets" && currentStep === 8) {
                  setCurrentStep(9);
                }
              }}
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
      <div className="app-sidebar-section" id="sidebar-game-list">
        {renderSectionHeader("Games", "games", isGamesExpanded)}

        {(isGamesExpanded || isCollapsed) && (
          <ul
            className={`nav-list games-list ${
              !isGamesExpanded ? "hidden" : ""
            }`}
          >
            {gamesToShow.map((game) => (
              <li
                key={game.name}
                className={`nav-item ${
                  selectedGame === game.name ? "active" : ""
                }`}
                onMouseEnter={() => setHoveredItem(`game-${game.name}`)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => {
                  if (currentStep === 5) {
                    setCurrentStep(6);
                  }
                }}
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
        <button
          className="show-more-games nav-link"
          onClick={() => setHideGames(!hideGames)}
          style={{ display: !isGamesExpanded ? "none" : "" }}
        >
          {hideGames ? (
            isCollapsed ? (
              <ArrowDown />
            ) : (
              <>
                <span>Show More Games</span> <ArrowDown size="16px" />
              </>
            )
          ) : isCollapsed ? (
            <ArrowUp />
          ) : (
            <>
              <span>Show Less Games</span> <ArrowUp size="16px" />
            </>
          )}
        </button>
      </div>

      {/* Social Links Section */}
      <div className="app-sidebar-section">
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
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
