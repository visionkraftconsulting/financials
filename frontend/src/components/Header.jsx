import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

const Header = () => {
  const { token, logout } = useContext(AuthContext);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Investment Tracker
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            {token ? (
              <>
                <li className="nav-item">
                  <Link to="/investments" className="nav-link">
                    Investments
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/wallets" className="nav-link">
                    Wallets
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/treasury" className="nav-link">
                    BTC Treasury
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/etfs" className="nav-link">
                    ETFs
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/cryptos" className="nav-link">
                    Cryptos
                  </Link>
                </li>
                <li className="nav-item">
                  <button onClick={logout} className="btn btn-outline-light btn-sm">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
