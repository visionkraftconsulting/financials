import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (parseInt(captchaInput, 10) !== captcha.a + captcha.b) {
      alert('Captcha answer is incorrect. Please try again.');
      return;
    }
    try {
      await axios.post('/api/contact', { name, email, subject, message });
      alert('Your message has been sent. Thank you!');
      setName(''); setEmail(''); setSubject(''); setMessage(''); setCaptchaInput('');
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setCaptcha({ a, b });
    } catch (err) {
      console.error('Error sending contact message', err);
      alert('Failed to send your message. Please try again later.');
    }
  };

  return (
    <div className="container py-5">
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            className="form-control"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            className="form-control"
            rows="5"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Captcha: What is {captcha.a} + {captcha.b}?</label>
          <input
            type="number"
            className="form-control"
            value={captchaInput}
            onChange={e => setCaptchaInput(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Send Message</button>
      </form>
    </div>
  );
};

export default ContactPage;