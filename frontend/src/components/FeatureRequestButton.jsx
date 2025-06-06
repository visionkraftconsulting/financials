import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthProvider';
import { ThemeContext } from '../ThemeContext';

/**
 * Floating button to submit feature requests to admins via the ticketing system.
 */
const FeatureRequestButton = () => {
  const { token } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  if (!token) return null;

  const handleOpen = () => {
    setSubject('Feature Request');
    setDescription('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        '/api/tickets',
        { subject, body: description, type: 'feature' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Feature request submitted');
      setShowModal(false);
    } catch (err) {
      console.error('Error submitting feature request', err);
      alert('Failed to submit feature request');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 1000 }}
        className={`btn ${theme === 'light' ? 'btn-outline-primary' : 'btn-outline-light'}`}
      >
        Request Feature
      </button>

      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
                <div className="modal-header">
                  <h5 className="modal-title">Request a Feature</h5>
                  <button type="button" className="close" onClick={() => setShowModal(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className={`modal-body ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className={`form-control ${theme === 'dark' ? 'bg-secondary text-light border-light' : ''}`}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className={`form-control ${theme === 'dark' ? 'bg-secondary text-light border-light' : ''}`}
                      rows="4"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className={`btn ${theme === 'light' ? 'btn-secondary' : 'btn-outline-light'}`}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline-light'}`}
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FeatureRequestButton;