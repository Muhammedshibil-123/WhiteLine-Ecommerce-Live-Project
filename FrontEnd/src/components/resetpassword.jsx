import React, { useState } from 'react';
import { useNavigate, useLocation,Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";
import "./login.css";

function ResetPassword() {
  const [passwords, setPasswords] = useState({
    new_password: "",
    confirm_password: ""
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  
  const email = location.state?.email;

  if (localStorage.getItem('access_token')) {
    return <Navigate to="/" replace />;
  }

  if (!email) {
    navigate('/forgot-password');
  }

  function handleChange(e) {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return toast.error("Passwords do not match");
    }
    if (passwords.new_password.length < 6) {
        return toast.error("Password must be at least 6 characters");
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/reset-password/`, {
        email: email,
        new_password: passwords.new_password,
        confirm_password: passwords.confirm_password
      });
      
      toast.success("Password Reset Successfully!");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || "Reset Failed");
    }
  };

  return (
    <div className="main-login-container">
      <div className="login-wrapper" style={{justifyContent:'center'}}>
        <div className="login-form-section" style={{width: '100%', maxWidth:'400px'}}>
          
          <div className="form-title">
            <h2>New Password</h2>
            <p>Create a new secure password</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={passwords.new_password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="submit-btn">RESET PASSWORD</button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;