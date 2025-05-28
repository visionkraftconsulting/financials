import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

const Header = () => {
  const { token, logout } = useContext(AuthContext);
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav>
        <ul className="flex space-x-4 justify-center flex-wrap">
          <li>
            <Link to="/" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base">
              Home
            </Link>
          </li>
          {token ? (
            <>
              <li>
                <Link
                  to="/investments"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Investments
                </Link>
              </li>
              <li>
                <Link
                  to="/wallets"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Wallets
                </Link>
              </li>
              <li>
                <Link
                  to="/treasury"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Treasury
                </Link>
              </li>
              <li>
                <Link
                  to="/etfs"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  ETFs
                </Link>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-gray-300 px-3 py-2 rounded-md text-sm md:text-base"
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;