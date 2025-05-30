import React from 'react';

const Footer = () => (
  <footer className="bg-dark text-light py-3 mt-auto">
    <div className="container text-center">
      <small>© {new Date().getFullYear()} Investment Tracker. All rights reserved.</small>
    </div>
  </footer>
);

export default Footer;