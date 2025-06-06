import React, { useContext } from 'react';

import { ThemeContext } from '../ThemeContext';

const Footer = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <footer className={`${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'} py-3 fixed-bottom`}>
      <div className="container text-center">
        <small>© {new Date().getFullYear()} SGA Investment Tracker. All rights reserved.</small>
        <div className="mt-2">
          <a href="/contact" className="mx-2">Contact</a>
          <a href="/terms" className="mx-2">Terms</a>
          <a href="/privacy" className="mx-2">Privacy</a>
          <a href="/disclosures" className="mx-2">Disclosures</a>
          <a href="/faq" className="mx-2">FAQ</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;