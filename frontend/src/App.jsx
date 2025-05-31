import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import InvestPage from './InvestPage';
import WalletPage from './WalletPage';
import PortfolioPage from './PortfolioPage';
import TreasuryPage from './TreasuryPage';
import EtfTrack from './EtfTrack'; // Ensure this matches the file name exactly
import CryptoPage from './CryptoPage';
import SgaPicks from './SgaPicks';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CountriesPage from './CountriesPage';
import { AuthProvider } from './AuthProvider';
import PrivateRoute from './PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeContext } from './ThemeContext';


function App() {
  const { theme } = useContext(ThemeContext);
  return (
    <AuthProvider>
      <Router>
        <div className={`d-flex flex-column min-vh-100 ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}`}>
          <Header />
          <main className="flex-fill">
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/countries" element={<CountriesPage />} />
              <Route path="/investments" element={<InvestPage />} />
              <Route path="/wallets" element={<WalletPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/treasury" element={<TreasuryPage />} />
              <Route path="/etfs" element={<EtfTrack />} />
              <Route path="/cryptos" element={<CryptoPage />} />
              <Route path="/sgapicks" element={<SgaPicks />} />
            </Route>
            <Route path="/" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
