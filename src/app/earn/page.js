"use client";
import FAQ from '@/components/Faq';
import NavBar from '../../components/NavBar';
import "./earn.css";
import { useState, useEffect, useContext } from 'react';
import { NearContext } from '@/app/context/NearContext';
import { SwapWidget } from '@ref-finance/ref-sdk'; 
import { init_env } from '@ref-finance/ref-sdk';

const EarnPage = () => {
  const { wallet, signedAccountId } = useContext(NearContext);
  const [swapState, setSwapState] = useState(null);
  const [tx, setTx] = useState(undefined);

  useEffect(() => {
    console.log("Context Wallet: ", wallet);
    console.log("Signed Account ID: ", signedAccountId);
  }, [wallet, signedAccountId]);

  useEffect(() => {
    init_env('testnet');
  }, []);

  const onSwap = async (transactionsRef) => {
    if (!signedAccountId) {
      console.error('No account signed in');
      return;
    }
    const walletSelectorTransactions = {
      transactions: transformTransactions(transactionsRef, signedAccountId),
    };
    return wallet.signAndSendTransactions(walletSelectorTransactions);
  };

  const handleLogin = () => {
    wallet.signIn();  
  };

  const handleLogout = async () => {
    await wallet.signOut();
  };

  return (
    <div className='earn-page'>
       <NavBar
        isLoggedIn={!!signedAccountId}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <div className='hero-section'></div>
      <div className="earn-container">
        <div className="swap-section">
          
            {signedAccountId ? (
              <SwapWidget
              onSwap={onSwap}
              connection={{ AccountId: signedAccountId, isSignedIn: !!signedAccountId }}
              width={'80%'}
              transactionState={{ state: swapState, setState: setSwapState, tx }}
              defaultTokenIn={'token.betvex.testnet'}
              defaultTokenOut={'usdc.betvex.testnet'}
              darkMode={true} 
              height={'30rem'}
            />
            
            ) : (
              <div className="placeholder">Please log in to use the swap feature.</div>
            )}
          
        </div>
        <div className="stake-section">
          <h2>Stake/Unstake</h2>
        </div>
      </div>
      <div className="faq-section">
        <FAQ />
      </div>
    </div>
  );
};

export default EarnPage;
