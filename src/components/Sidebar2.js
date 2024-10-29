import Link from 'next/link';
import { useState } from 'react';

const Sidebar2 = ({ }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsCollapsed(!isCollapsed);
      setIsTransitioning(false);
    }, 300);
  };


  const socials = [
    { name: 'Telegram', icon: '/icons/socials/telegram.png', link: 'https://t.me/+4x6uwCjC7BgzNmRk' },
    { name: 'x', icon: '/icons/socials/x.png', link: 'https://x.com/betvex' },
    { name: 'TikTok', icon: '/icons/socials/tiktok.png', link: 'https://www.tiktok.com/@betvex' },
    { name: 'Instagram', icon: '/icons/socials/instagram.png', link: 'https://www.instagram.com/getvexy?igsh=Nzl4cDIzbGZwNDR2&utm_source=qr' },
  ];

  return (
    <div className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
      <ul>
        <li>
          <button className="toggle-button" onClick={toggleSidebar}>
            {isCollapsed ? '→' : '←'}
          </button>
        </li>
        <li>
          <Link href="/" legacyBehavior>
            <a>
              <img src="/icons/home.png" alt="Home" style={{ width: '17px', height: '17px' }} />
              {!isCollapsed && <span>Home</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/earn" legacyBehavior>
            <a>
              <img src="/icons/staking.png" alt="earn" style={{ width: '17px', height: '17px' }} />
              {!isCollapsed && <span>Earn</span>}
            </a>
          </Link>
        </li>
        <li>
          <Link href="/governance" legacyBehavior>
            <a>
              <img src="/icons/governance.png" alt="Governance" style={{ width: '17px', height: '17px' }} />
              {!isCollapsed && <span>Governance</span>}
            </a>
          </Link>
        </li>
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

export default Sidebar2;
