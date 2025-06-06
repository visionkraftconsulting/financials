import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';
import { ThemeContext } from '../ThemeContext';
import { useSubscription } from '../SubscriptionContext';

const Header = () => {
  const { token, user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [navOpen, setNavOpen] = useState(false);
  const { subscription, loading } = useSubscription();
  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing';
  return (
    <nav className={`navbar fixed-top navbar-expand-lg ${theme === 'light' ? 'navbar-light bg-light' : 'navbar-dark bg-dark'}`}>
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
        <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            {token ? (
              <>
                {loading && (
                  <li className="nav-item">
                    <span className="nav-link">
                      <div className="spinner-border spinner-border-sm text-secondary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </span>
                  </li>
                )}
                {isSubscribed && (
                  <>
                    <li className="nav-item dropdown">
                      <a className="nav-link dropdown-toggle" href="#" id="accountsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Accounts
                      </a>
                      <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="accountsDropdown">
                        <li>
                          <Link to="/investments" className="dropdown-item">
                            Investments
                          </Link>
                        </li>
                        <li>
                          <Link to="/wallets" className="dropdown-item">
                            Wallets
                          </Link>
                        </li>
                        <li>
                          <Link to="/sgawallet" className="dropdown-item">
                            SGA Wallet
                          </Link>
                        </li>
                        <li>
                          <Link to="/portfolio" className="dropdown-item">
                            Portfolio
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li className="nav-item dropdown">
                      <a className="nav-link dropdown-toggle" href="#" id="marketsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Markets
                      </a>
                      <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="marketsDropdown">
                        <li>
                          <Link to="/treasury" className="dropdown-item">
                            BTC Treasury
                          </Link>
                        </li>
                        <li>
                          <Link to="/etfs" className="dropdown-item">
                            ETFs
                          </Link>
                        </li>
                        <li>
                          <Link to="/cryptos" className="dropdown-item">
                            Cryptos
                          </Link>
                        </li>
                      </ul>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <Link to="/subscription" className="nav-link">
                    Subscription
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
                {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
                  <li className="nav-item">
                    <Link to="/admin/subscriptions" className="nav-link">
                      Manage Subscriptions
                    </Link>
                  </li>
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
