import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link href="/" legacyBehavior>
            <a>
              <img src="/icons/home.svg" alt="Home" />
              Home
            </a>
          </Link>
        </li>
        <li>
          <Link href="/staking" legacyBehavior>
            <a>
              <img src="/icons/staking.svg" alt="Staking" />
              Staking
            </a>
          </Link>
        </li>
        <li>
          <Link href="/governance" legacyBehavior>
            <a>
              <img src="/icons/governance.svg" alt="Governance" />
              Governance
            </a>
          </Link>
        </li>
      </ul>
      <div className="section-title">Popular</div>
      <ul>
        <li>
          <a href="#">
            <img src="/icons/csgo.png" alt="CSGO" />
            CSGO
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/lol.png" alt="League of Legends" />
            League of Legends
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/valorant.png" alt="Valorant" />
            Valorant
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/fortnite.png" alt="Fortnite" />
            Fortnite
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/apex.png" alt="Apex Legends" />
            Apex Legends
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/rainbowsix.png" alt="Rainbow Six Siege" />
            Rainbow Six Siege
          </a>
        </li>
        <li>
          <a href="#">
            <img src="/icons/dota2.png" alt="Dota 2" />
            Dota 2
          </a>
        </li>
      </ul>
      <div className="section-title">User Area</div>
      <ul>
        <li>
          <a href="#">
            <img src="/icons/user.png" alt="User Area" />
            User Area
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
