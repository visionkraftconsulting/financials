import React, { useContext, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import InvestPage from './InvestPage';
import WalletPage from './WalletPage';
import PortfolioPage from './PortfolioPage';
import TreasuryPage from './TreasuryPage';
import EtfTrack from './EtfTrack'; // Ensure this matches the file name exactly
import CryptoPage from './CryptoPage';
import SgaPicks from './SgaPicks';
import SGAWallet from './SGAWallet';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CountriesPage from './CountriesPage';
import FinancialReportsMetaPage from './FinancialReportsMetaPage';
import AdminUsersPage from './AdminUsersPage';
import AdminSubscriptionsPage from './AdminSubscriptionsPage';
import SubscriptionPage from './SubscriptionPage';
import { AuthProvider } from './AuthProvider';
import PrivateRoute from './PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import SubscriptionProvider from './SubscriptionContext';
import SubscriptionRoute from './SubscriptionRoute';
import { ThemeContext } from './ThemeContext';

// Solana Wallet Adapter
import { clusterApiUrl } from '@solana/web3.js';
import {
  ConnectionProvider as SolConnectionProvider,
  WalletProvider as SolWalletProvider
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  WalletConnectWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';


function App() {
  const { theme } = useContext(ThemeContext);

  // ------- Solana Wallet Adapter Setup -------
  const solanaEndpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  const solanaWallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          projectId: process.env.REACT_APP_WC_PROJECT_ID,
          metadata: {
            name: 'Smart Growth Assets',
            url: window.location.origin,
            icons: [`${window.location.origin}/logo192.png`]
          }
        }
      })
    ],
    []
  );
  // --------------------------------------------
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SolConnectionProvider endpoint={solanaEndpoint}>
          <SolWalletProvider wallets={solanaWallets} autoConnect>
            <WalletModalProvider>
              <Router>
                <div className={`d-flex flex-column min-vh-100 ${
                  theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}
                `}>
                  <Header />
                  <main className="flex-fill">
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route element={<PrivateRoute />}>
                        <Route path="/subscription" element={<SubscriptionPage />} />
                        <Route path="/countries" element={<CountriesPage />} />
                        <Route path="/financial-reports-meta" element={<FinancialReportsMetaPage />} />

                        <Route element={<SubscriptionRoute />}>
                          <Route path="/investments" element={<InvestPage />} />
                          <Route path="/wallets" element={<WalletPage />} />
                          <Route path="/sgawallet" element={<SGAWallet />} />
                          <Route path="/portfolio" element={<PortfolioPage />} />
                          <Route path="/treasury" element={<TreasuryPage />} />
                          <Route path="/etfs" element={<EtfTrack />} />
                          <Route path="/cryptos" element={<CryptoPage />} />
                          <Route path="/sgapicks" element={<SgaPicks />} />
                        </Route>

                        <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                      </Route>
                      <Route path="/" element={<HomePage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </Router>
            </WalletModalProvider>
          </SolWalletProvider>
        </SolConnectionProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
