import Link from 'next/link';

const NavBar = ({ isLoggedIn, walletBalance, onLogin, onLogout }) => {
  return (
    <nav className="nav">
      <Link href="/" legacyBehavior>
        <a className="logo"><img src='/icons/primary_logo.png' alt='VEX' /></a>
      </Link>
      <div className="nav-buttons">
        {isLoggedIn ? (
          <>
            <div className="wallet-balance">Balance: {walletBalance} NEAR</div>
            <button onClick={onLogout}>Log Out</button>
          </>
        ) : (
          <button onClick={onLogin}>Log In with NEAR</button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;