import Link from 'next/link';
import { useState } from 'react';

const Sidebar = ({ onSelectGame, selectedGame }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const games = [
    { name: 'csgo', label: 'CSGO', icon: '/icons/csgo.png' },
    { name: 'lol', label: 'League of Legends', icon: '/icons/lol.png' },
    { name: 'valorant', label: 'Valorant', icon: '/icons/valorant.png' },
    { name: 'fortnite', label: 'Fortnite', icon: '/icons/fortnite.png' },
    { name: 'apex', label: 'Apex Legends', icon: '/icons/apex.png' },
    { name: 'rainbowsix', label: 'Rainbow Six Siege', icon: '/icons/rainbowsix.png' },
    { name: 'dota2', label: 'Dota 2', icon: '/icons/dota2.png' },
  ];

  return (
    <div className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <ul>
        <li>
        <button className="toggle-button" onClick={toggleSidebar}>
        {isCollapsed ? '→' : '←'}
      </button>
        </li>
        <li>
          <Link href="/" legacyBehavior>
            <a>
              <img src="/icons/home.png" alt="Home"  style={{ width: '32px', height: '32px' }} />
              {!isCollapsed && <span>Home</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/earn" legacyBehavior>
            <a>
              <img src="/icons/staking.png" alt="earn" style={{ width: '32px', height: '32px' }}/>
              {!isCollapsed && <span>Earn</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/governance" legacyBehavior>
            <a>
              <img src="/icons/governance.png" alt="Governance" style={{ width: '32px', height: '32px' }}/>
              {!isCollapsed && <span>Governance</span>}
            </a>
          </Link>
        </li>
      </ul>
      <div className="section-title">{!isCollapsed && 'Popular'}</div>
      <ul>
        {games.map((game) => (
          <li key={game.name}>
            <a
              href="#"
              onClick={() => onSelectGame(game.name)}
              className={game.name === selectedGame ? 'selected' : ''}
            >
              <img src={game.icon} alt={game.label} />
              {!isCollapsed && <span>{game.label}</span>}
            </a>
          </li>
        ))}
      </ul>
      <div className="section-title">{!isCollapsed && 'User Area'}</div>
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
