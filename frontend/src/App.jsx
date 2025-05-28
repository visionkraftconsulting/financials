import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './HomePage';
import InvestPage from './InvestPage';
import WalletPage from './WalletPage';
import TreasuryPage from './TreasuryPage';
import EtfTrack from './EtfTrack'; // Ensure this matches the file name exactly

// Navigation bar with Tailwind CSS
const NavBar = () => (
  <nav className="bg-gray-800 text-white p-4">
    <ul className="flex space-x-4 justify-center flex-wrap">
      <li>
        <Link to="/" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
          Home
        </Link>
      </li>
      <li>
        <Link to="/investments" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
          Investments
        </Link>
      </li>
      <li>
        <Link to="/wallets" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
          Wallets
        </Link>
      </li>
      <li>
        <Link to="/treasury" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
          Treasury
        </Link>
      </li>
      <li>
        <Link to="/etfs" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
          ETFs
        </Link>
      </li>
    </ul>
  </nav>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/investments" element={<InvestPage />} />
          <Route path="/wallets" element={<WalletPage />} />
          <Route path="/treasury" element={<TreasuryPage />} />
          <Route path="/etfs" element={<EtfTrack />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
