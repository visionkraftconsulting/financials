import React, { useContext } from 'react';

import { ThemeContext } from '../ThemeContext';

const Footer = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <footer className={`${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'} py-3 mt-auto`}>
      <div className="container text-center">
        <small>© {new Date().getFullYear()} SGA Investment Tracker. All rights reserved.</small>
      </div>
    </footer>
  );
};

export default Footer;