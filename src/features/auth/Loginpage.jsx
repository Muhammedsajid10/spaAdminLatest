// LoginPage.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './Loginpage.css';
import { Base_url } from '@api/config';
import alloraLogo from '@assets/alloraLogo.jpg';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${Base_url}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                navigate('/'); // Navigate to root (which is now calendar)
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Login failed',
                    confirmButtonColor: '#1f2937'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Error',
                text: 'Unable to login. Please try again.',
                confirmButtonColor: '#1f2937'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="left-section">
                <div className="brand-content">
                    <img src={alloraLogo} alt="Allora" className="brand-logo" />
                    <h1 className="brand-title">Allora</h1>
                    <p className="brand-subtitle">Premium wellness and beauty management</p>
                    <button className="read-more-btn">Read More</button>
                </div>
            </div>
            
            <div className="right-section">
                <div className="login-form-container">
                    <div className="form-header">
                        <h2 className="form-title">Hello Again!</h2>
                        <p className="form-subtitle">Welcome Back</p>
                       
                    </div>
                    
                    <form className="login-form" onSubmit={handleSubmit}>
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
                        
                        <button type="submit" className="login-btn" disabled={isLoading} aria-busy={isLoading} aria-live="polite">
                            {isLoading ? (
                                <span className="btn-loading">
                                    <span className="btn-spinner" aria-hidden="true"></span>
                                    Logging in...
                                </span>
                            ) : (
                                'Login'
                            )}
                        </button>
                        
                        {/* <a href="#" className="forgot-password">
                            Forgot Password
                        </a> */}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;