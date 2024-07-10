import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import FeaturedGames from '@/components/FeaturedGames';
import UpcomingGames from '@/components/UpcomingGames';

export default function HomePage() {
  // Simulate login state and wallet balance
  const isLoggedIn = true;
  const walletBalance = "100 NEAR";

  return (
    <div className="container">
      <NavBar isLoggedIn={isLoggedIn} walletBalance={walletBalance} />
      <Sidebar />
      <div className="mainContent">
      <h1 style={{ color: 'white' }}>Home Page</h1>


        <FeaturedGames />
        <UpcomingGames />
        
      </div>
    </div>
  );
}
