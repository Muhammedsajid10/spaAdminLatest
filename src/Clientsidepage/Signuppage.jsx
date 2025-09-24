import React, { useState } from 'react';
import './Signuppage.css';
import axios from 'axios';
import { Base_url } from '../Service/Base_url';
import api from '../Service/Api';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post("/auth/signup", formData);
      console.log('Signup successful:', response.data);
      // Handle successful signup - redirect to login or dashboard
      alert('Account created successfully! Please check your email for verification.');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="left-section">
        <div className="brand-content">
          <h1 className="brand-title">Allora</h1>
          <p className="brand-subtitle">The most popular Spa centre</p>
          <button className="read-more-btn">Read More</button>
        </div>
      </div>
      
      <div className="right-section">
        <div className="signin-form-container">
          <div className="form-header">
            <h2 className="form-title">Hello </h2>
            <p className="form-subtitle">Welcome </p>
          </div>
          
          <form className="signin-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input half-width"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input half-width"
                required
              />
            </div>
            
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
            />
            
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              className="form-input"
              required
            />
            
            <button type="submit" className="signin-btn">
              Sign In
            </button>
            
            <a href="#" className="forgot-password">
              Forgot Password
            </a>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;