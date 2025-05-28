import React from 'react';

const Footer = () => (
  <footer className="bg-gray-800 text-white p-4 mt-8">
    <div className="text-center text-sm">
      © {new Date().getFullYear()} Investment Tracker. All rights reserved.
    </div>
  </footer>
);

export default Footer;