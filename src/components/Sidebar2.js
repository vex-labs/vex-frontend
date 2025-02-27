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
import { socials } from "@/data/socials";

/**
 * Sidebar2 component
 * Enhanced version with improved UI/UX
 * Used in the user page and earn page
 *
 * @returns {JSX.Element} The rendered Sidebar2 component
 */

const Sidebar2 = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSocialsExpanded, setIsSocialsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hideCollapseButton, setHideCollapseButton] = useState(false);

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
      label: "Home",
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
      name: "governance",
      label: "Governance",
      path: "/governance",
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
  ];

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Render a section header with expandable toggle
  const renderSectionHeader = (title, section, isExpanded, toggleFn) => (
    <div
      className={`app-sidebar-section-header ${isCollapsed ? "collapsed" : ""}`}
      onClick={() => !isCollapsed && toggleFn()}
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
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle Button */}
      <button
        className="app-sidebar-toggle"
        onClick={toggleSidebar}
        style={{
          display: hideCollapseButton ? "none" : "",
        }}
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

      {/* Social Links Section */}
      <div className="app-sidebar-section">
        {renderSectionHeader("Socials", "socials", isSocialsExpanded, () =>
          setIsSocialsExpanded(!isSocialsExpanded),
        )}

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
      <div className="app-sidebar-section user-section">
        {isCollapsed ? (
          <div className="app-sidebar-section-header collapsed">
            <span className="section-title">User</span>
          </div>
        ) : (
          <div className="app-sidebar-section-header">
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

export default Sidebar2;
