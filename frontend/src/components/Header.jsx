import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';
import { ThemeContext } from '../ThemeContext';

const Header = () => {
  const { token, user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [navOpen, setNavOpen] = useState(false);
  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'light' ? 'navbar-light bg-light' : 'navbar-dark bg-dark'}`}>
      <div className="container">
        <Link to="/" className="navbar-brand">
          Investment Tracker
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen(!navOpen)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`navbar-collapse ${navOpen ? 'show d-flex flex-column' : 'd-none d-lg-flex'}`}>
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
                  <Link to="/sgawallet" className="nav-link">
                    SGA Wallet
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/portfolio" className="nav-link">
                    Portfolio
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
{user?.role === 'Super Admin' && (
  <>
    <li className="nav-item">
      <Link to="/financial-reports-meta" className="nav-link">
        Financial Reports Meta
      </Link>
    </li>
    <li className="nav-item">
      <Link to="/admin/users" className="nav-link">
        Manage Users
      </Link>
    </li>
  </>
)}
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
            <li className="nav-item">
              <button
                onClick={toggleTheme}
                className={`btn btn-sm ${theme === 'light' ? 'btn-outline-secondary' : 'btn-outline-light'} ms-3`}
              >
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
