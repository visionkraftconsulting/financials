import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all')
      .then((res) => res.json())
      .then((data) => {
        const countryNames = data
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));
        setCountries(countryNames);
      })
      .catch((err) => {
        console.error('Failed to fetch countries:', err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        { email, password, name, phone, country }
      );
      navigate('/login', { state: { fromRegister: true } });
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
          <h2>Register</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div>
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', margin: '0.5rem 0' }}
              />
            </div>
            <div>
              <label>Phone Number:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', margin: '0.5rem 0' }}
              />
            </div>
            <div>
              <label>Country (optional):</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '0.5rem 0' }}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', margin: '0.5rem 0' }}
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', margin: '0.5rem 0' }}
              />
            </div>
            <button type="submit" style={{ padding: '8px 16px' }}>
              Register
            </button>
          </form>
          <p style={{ marginTop: '1rem' }}>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;