import React, { useContext, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import profileimg from '../assets/account-profile.png'
import './profile.css'
import { CartContext } from '../component/cartcouter'
import { WishlistContext } from '../component/whislistcouter'
import { FaBoxOpen, FaHeart, FaShoppingBag, FaSignOutAlt } from 'react-icons/fa'
import axios from 'axios'
import { toast } from "react-toastify"

function Profile() {
    const navigate = useNavigate()
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const { cartcount } = useContext(CartContext)
    const { Whishlistcount } = useContext(WishlistContext)

    
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const userId = localStorage.getItem('id');

                if (!token || !userId) {
                    navigate('/login');
                    return;
                }

              
                const response = await axios.get(`${API_URL}/users/${userId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                
                setUserData(response.data);
                setLoading(false);

            } catch (error) {
                console.error("Error fetching profile:", error);
                setLoading(false);
                if (error.response && error.response.status === 401) {
                    toast.error("Session expired. Please login again.");
                    logouthandlechange();
                } else {
                    toast.error("Could not retrieve user details.");
                }
            }
        };

        fetchUserProfile();
    }, [API_URL, navigate]);

    function logouthandlechange(){
        localStorage.clear()
        navigate('/login')
        window.location.reload()
    }

    if (loading) {
        return <div className="profile-page-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'50vh'}}>Loading Profile...</div>;
    }

    return (
        <div className='profile-page-wrapper'>
            <div className="profile-header-section">
                <h1>MY ACCOUNT</h1>
                <div className="underline"></div>
            </div>

            <div className='profile-grid'>
                
                <div className='profile-card'>
                    <div className="avatar-container">
                        <img src={profileimg} alt="User" />
                    </div>
                    
                    
                    <h2 className="profile-name">{userData?.username}</h2>
                    <p className="profile-email">{userData?.email}</p>

                    <button className="logout-btn" onClick={logouthandlechange}>
                        <FaSignOutAlt /> LOGOUT
                    </button>
                </div>

                
                <div className='profile-details-section'>
                    
                    
                    <div className="stats-grid">
                        <div className="stat-card" onClick={() => navigate('/cart')}>
                            <div className="icon"><FaShoppingBag /></div>
                            <div className="info">
                                <h3>{cartcount}</h3>
                                <p>In Bag</p>
                            </div>
                        </div>
                        <div className="stat-card" onClick={() => navigate('/whishlist')}>
                            <div className="icon"><FaHeart /></div>
                            <div className="info">
                                <h3>{Whishlistcount}</h3>
                                <p>Wishlist</p>
                            </div>
                        </div>
                        <div className="stat-card" onClick={() => navigate('/myorders')}>
                            <div className="icon"><FaBoxOpen /></div>
                            <div className="info">
                                <h3>Orders</h3>
                                <p>Track</p>
                            </div>
                        </div>
                    </div>

                    
                    <div className="info-box">
                        <div className="box-header">
                            <h3>PERSONAL DETAILS</h3>
                        </div>
                        
                        <div className="details-grid-view">
                            <div className="detail-item">
                                <label>Full Name</label>
                                <span>{userData?.username}</span>
                            </div>
                            <div className="detail-item">
                                <label>Email Address</label>
                                <span>{userData?.email}</span>
                            </div>
                            <div className="detail-item">
                                <label>Mobile Number</label>
                                
                                <span>{userData?.mobile || "Not Provided"}</span>
                            </div>
                        </div>
                    </div>

                    
                    <div className="quick-actions">
                        <NavLink to="/about" className="action-link">
                            📞 Support
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile