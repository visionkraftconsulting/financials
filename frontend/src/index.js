import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';
import App from './App';
import ThemeProvider from './ThemeContext';
import reportWebVitals from './reportWebVitals';

if (typeof window !== 'undefined' && 'ontouchstart' in window) {
  let startY = 0;
  let pulling = false;
  window.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const currentY = e.touches[0].clientY;
    if (currentY - startY > 100) {
      pulling = false;
      window.location.reload();
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { pulling = false; });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
