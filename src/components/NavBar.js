import Link from 'next/link';

const NavBar = ({ isLoggedIn, walletBalance }) => {
  return (
    <nav className="nav">
      <Link href="/" legacyBehavior>
        <a className="logo"><img src='/icons/primary_logo.png' alt='VEX' /></a>
      </Link>
      <div className="nav-buttons">
        {isLoggedIn ? (
          <>
            <div className="wallet-balance">Balance: {walletBalance} NEAR</div>
            <button>Log Out</button>
          </>
        ) : (
          <>
            <Link href="/signup" legacyBehavior>
              <a>Sign Up</a>
            </Link>
            <Link href="/login" legacyBehavior>
              <a>Log In</a>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
