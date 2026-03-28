import "./signup.css";
import { NavLink, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; 

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirm_password: ""
  });
  
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  if (localStorage.getItem('access_token')) {
    return <Navigate to="/" replace />;
  }

  function handleChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function validate() {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email";
    if (formData.mobile.length !== 10) newErrors.mobile = "10 digit mobile required";
    if (formData.password.length < 6) newErrors.password = "Min 6 chars";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match";
    
    return newErrors;
  }

  async function submit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/users/register/`, formData);
        
        toast.success("OTP Sent to your email!");
        navigate('/otp-verify', { state: { email: formData.email } });
        
      } catch (err) {
        console.error(err);
        if (err.response && err.response.data) {
           toast.error(JSON.stringify(err.response.data));
        } else {
           toast.error("Signup Failed");
        }
      }
    }
  }

  return (
    <div className="main-signup-container">
      <div className="signup-wrapper">
        

        <div className="signup-image-section">
           <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop" alt="Style" />
           <div className="text-overlay">
              <h1>Join the<br/>Cult.</h1>
              <p>Exclusive Drops & Rewards</p>
           </div>
        </div>

        <div className="signup-form-section">
            <div className="form-title">
                <h2>Create Account</h2>
                <p>Sign up to start shopping</p>
            </div>

            <form onSubmit={submit} noValidate>
            
              <div className="signup-form-group">
                  <label>Username</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
                  {errors.username && <span className="signup-error">{errors.username}</span>}
              </div>

              <div className="signup-form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" />
                  {errors.email && <span className="signup-error">{errors.email}</span>}
              </div>

              <div className="signup-form-group">
                  <label>Mobile Number</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" />
                  {errors.mobile && <span className="signup-error">{errors.mobile}</span>}
              </div>

              <div className="signup-form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                  {errors.password && <span className="signup-error">{errors.password}</span>}
              </div>

              <div className="signup-form-group">
                  <label>Confirm Password</label>
                  <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="••••••••" />
                  {errors.confirm_password && <span className="signup-error">{errors.confirm_password}</span>}
              </div>

              <button type="submit" className="signup-btn">SIGN UP</button>
            </form>

            <div className="login-footer">
              <p>Already have an account? <NavLink to="/login">Login</NavLink></p>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;