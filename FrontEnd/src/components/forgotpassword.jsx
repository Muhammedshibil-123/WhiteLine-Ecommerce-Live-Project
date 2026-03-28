import React, { useState } from 'react';
import { useNavigate,Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";
import "./login.css"; 

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false); 
  const navigate = useNavigate();
  
  if (localStorage.getItem('access_token')) {
    return <Navigate to="/" replace />;
  }
  
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/forgot-password/`, { email });
      toast.success("OTP sent to your email!");
      setIsOtpSent(true); 
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    }
  };


  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-forgot-otp/`, { email, otp });
      toast.success("OTP Verified!");
      
      navigate('/reset-password', { state: { email: email } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    }
  };

  return (
    <div className="main-login-container">
      <div className="login-wrapper" style={{justifyContent:'center'}}>
        <div className="login-form-section" style={{width: '100%', maxWidth:'400px'}}>
          
          <div className="form-title">
            <h2>Forgot Password</h2>
            <p>{isOtpSent ? "Enter the OTP sent to your email" : "Enter your email to reset password"}</p>
          </div>

          {!isOtpSent ? (
            
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <button type="submit" className="submit-btn">SEND OTP</button>
            </form>
          ) : (
            
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>
              <button type="submit" className="submit-btn">VERIFY OTP</button>
              <p 
                style={{textAlign:'center', marginTop:'10px', cursor:'pointer', color:'#666'}}
                onClick={() => setIsOtpSent(false)}
              >
                Change Email
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;