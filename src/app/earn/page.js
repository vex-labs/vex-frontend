"use client";
import FAQ from '@/components/Faq';
import NavBar from '../../components/NavBar';
import "./earn.css";
import { useState, useEffect, useContext } from 'react';
import { NearContext } from '@/app/context/NearContext';
import { SwapWidget } from '@ref-finance/ref-sdk'; 
import { init_env } from '@ref-finance/ref-sdk';

const EarnPage = () => {
  const { wallet, signedAccountId } = useContext(NearContext); // Access wallet context
  const [swapState, setSwapState] = useState(null);
  const [tx, setTx] = useState(undefined);

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

  return (
    <div className='earn-page'>
      <NavBar />
      <div className='hero-section'></div>
      <div className="earn-container">
        <div className="swap-section">
          <h2>Token Swap</h2>
            <div>
             
              {signedAccountId && (
                <SwapWidget
                onSwap={onSwap}
                connection={{ AccountId: signedAccountId, isSignedIn: !!signedAccountId }}
                width={'500px'}
                transactionState={{ state: swapState, setState: setSwapState, tx }}
                defaultTokenIn={'token.betvex.testnet'}  // Example token on testnet
                defaultTokenOut={'usdc.betvex.testnet'}
              />
              )}
            </div>
         
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


