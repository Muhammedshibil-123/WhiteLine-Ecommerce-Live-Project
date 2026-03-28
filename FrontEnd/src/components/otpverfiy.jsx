import React, { useState } from 'react';
import { useLocation, useNavigate,Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";
import { useAuth } from '../component/AuthContext'; 

function OtpVerify() {
  const [otp, setOtp] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const email = location.state?.email;

  if (localStorage.getItem('access_token')) {
    return <Navigate to="/" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if(!otp) return toast.error("Please enter OTP");

    try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-otp/`, {
            email: email,
            otp: otp
        });

        if(res.status === 200) {
            toast.success("Verification Successful!");
            login(res.data, {
                access: res.data.access,
                refresh: res.data.refresh
            });
            navigate('/'); 
        }
    } catch (err) {
        toast.error(err.response?.data?.error || "Verification Failed");
    }
  }

  return (
    <div className="main-signup-container"> 
        <div className="otp-container-wrapper">
            <div className="otp-header">
                <h2>OTP Verfication</h2>
                <p>Please enter the 6-digit code sent to<br/><strong>{email || 'your email'}</strong></p>
            </div>
            
            <form onSubmit={handleVerify}>
                <div className="signup-form-group">
                    <input 
                        className="otp-input-box"
                        type="text" 
                        maxLength="6"
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="000000"
                        autoFocus
                    />
                </div>
                <button type="submit" className="otp-btn">VERIFY & LOGIN</button>
            </form>
            
            <div style={{marginTop: '20px', fontSize: '12px', color: '#999'}}>
               <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => navigate('/login')}>Back to Login</span>
            </div>
        </div>
    </div>
  );
}

export default OtpVerify;