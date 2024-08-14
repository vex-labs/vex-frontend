import Link from 'next/link';
import { useState } from 'react';


const Sidebar = ({ onSelectGame, selectedGame }) => {
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
    <div className="app-sidebar">
      <ul>
        <li>
          <Link href="/" legacyBehavior>
            <a>
              <img src="/icons/home.png" alt="Home" style={{ width: '32px', height: '32px' }} />
              Home
            </a>
          </Link>
        </li>
        <li>
          <Link href="/staking" legacyBehavior>
            <a>
              <img src="/icons/staking.png" alt="Staking" style={{ width: '32px', height: '32px' }}/>
              Staking
            </a>
          </Link>
        </li>
        <li>
          <Link href="/governance" legacyBehavior>
            <a>
              <img src="/icons/governance.png" alt="Governance" style={{ width: '32px', height: '32px' }}/>
              Governance
            </a>
          </Link>
        </li>
      </ul>
      <div className="section-title">Popular</div>
      <ul>
        {games.map((game) => (
          <li key={game.name}>
            <a
              href="#"
              onClick={() => onSelectGame(game.name)}
              className={game.name === selectedGame ? styles.selected : ''}
            >
              <img src={game.icon} alt={game.label} />
              {game.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="section-title">User Area</div>
      <ul>
        <li>
          <Link href="/user" legacyBehavior>
            <a>
              <img src="/icons/user.png" alt="User Area" />
              User Area
            </a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;