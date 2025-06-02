import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import { Navigate } from 'react-router-dom';

const FinancialReportsMetaPage = () => {
  const { user, token } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jsonData, setJsonData] = useState({});
  const [jsonLoading, setJsonLoading] = useState({});
  const [jsonError, setJsonError] = useState({});

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      const API_BASE_URL =
        process.env.NODE_ENV === 'production'
          ? 'https://smartgrowthassets.com'
          : 'http://52.25.19.40:4005';

      axios
        .get(`${API_BASE_URL}/api/financial_reports_meta`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch financial reports metadata:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [user, token]);

  useEffect(() => {
    if (data.length) {
      data.forEach((row) => {
        setJsonLoading((prev) => ({ ...prev, [row.id]: true }));
        axios
          .get(row.link_json)
          .then((res) => {
            setJsonData((prev) => ({ ...prev, [row.id]: res.data }));
          })
          .catch((err) => {
            setJsonError((prev) => ({ ...prev, [row.id]: err.message }));
          })
          .finally(() => {
            setJsonLoading((prev) => ({ ...prev, [row.id]: false }));
          });
      });
    }
  }, [data]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mt-4 bg-dark text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4 bg-dark text-white">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Helper to render JSON as a table
  const renderJsonAsTable = (json) => {
    const rows = [];
    let rowCounter = 0;

    const addRow = (key, value) => {
      rows.push(
        <tr key={`${key}-${rowCounter++}`}>
          <td style={{ width: '30%', fontWeight: 'bold' }}>{key}</td>
          <td>{value}</td>
        </tr>
      );
    };

    const formatValue = (val) => {
      if (Array.isArray(val)) {
        return val.map(formatValue).join('; ');
      } else if (val && typeof val === 'object') {
        return JSON.stringify(val);
      } else {
        return val;
      }
    };

    if (json.symbol) addRow('Symbol', formatValue(json.symbol));
    if (json.period) addRow('Period', formatValue(json.period));
    if (json.year) addRow('Year', formatValue(json.year));

    if (Array.isArray(json['Cover Page'])) {
      json['Cover Page'].forEach((entry, i) => {
        Object.entries(entry).forEach(([k, v]) => {
          addRow(k, formatValue(v));
        });
      });
    }

    Object.entries(json).forEach(([key, val]) => {
      if (['symbol', 'period', 'year', 'Cover Page'].includes(key)) return;
      addRow(key, formatValue(val));
    });

    return (
      <table className="table table-sm table-bordered table-dark mt-2">
        <tbody>{rows}</tbody>
      </table>
    );
  };

  return (
    <div className="container mt-4 bg-dark text-white">
      <h2>Financial Reports Metadata</h2>
      <table className="table table-striped table-bordered table-dark mt-3">
        <thead>
          <tr>
            <th>Report JSON</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td>No records found.</td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id}>
              <td>
                {jsonLoading[row.id] && 'Loading JSON...'}
                {jsonError[row.id] && `Error: ${jsonError[row.id]}`}
                {jsonData[row.id] && renderJsonAsTable(jsonData[row.id])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialReportsMetaPage;