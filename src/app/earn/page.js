"use client";
import FAQ from '@/components/Faq';
import "./earn.css";
import Staking from '@/components/Stake';
import Swap from '@/components/Swap';

let useNear;
if (typeof window !== 'undefined') {
  try {
    useNear = require('@/app/context/NearContext').useNear;
  } catch (error) {
    console.warn("NearContext is not available:", error);
    useNear = null; // Fallback to null if NearContext is not available
  }
}

const EarnPage = () => {
  const isVexLogin = typeof window !== 'undefined' && localStorage.getItem('isVexLogin') === 'true';

  let wallet = null;
  let signedAccountId = null;

  //  use NearContext only if the user is logged in with NEAR
  if (!isVexLogin && useNear) {
    try {
      const nearContext = useNear();
      wallet = nearContext?.wallet || null;
      signedAccountId = nearContext?.signedAccountId || null;
    } catch (error) {
      console.error("Error accessing NearContext:", error);
    }
  }
  console.log('isVexLogin:', isVexLogin);

  return (
    <div className='earn-page'>
      <div className="earn-container">
        <div className="swap-section">
          <Swap
            wallet={wallet} 
            signedAccountId={signedAccountId} 
            isVexLogin={isVexLogin} 
          />
        </div>
  
        <div className="stake-section">
          <Staking
           wallet={wallet} 
           signedAccountId={signedAccountId} 
           isVexLogin={isVexLogin} 
          />
        </div>
      </div>
  
      <div className="faq-section">
        <FAQ />
      </div>
    </div>
  );
};

export default EarnPage;
