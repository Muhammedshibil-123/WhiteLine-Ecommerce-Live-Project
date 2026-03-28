import React, { useState, useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './navbar.css'

import cart from '../assets/cart.png'
import search from '../assets/serach.png'
import whishlist from '../assets/whishlist.png'
import account from '../assets/account.png'

import { FaUser, FaUserShield, FaSignOutAlt,FaMapMarkerAlt } from "react-icons/fa";

import { CartContext } from '../component/cartcouter.jsx'
import { WishlistContext } from '../component/whislistcouter.jsx'
import { SearchContext } from '../component/searchcontext.jsx'

function Navbar() {
    const userId = (localStorage.getItem("username"))
    const [searchnav, setSearchnav] = useState('')
    const navigate = useNavigate()
    const { cartcount } = useContext(CartContext)
    const { Whishlistcount } = useContext(WishlistContext)
    const { setSearchTerm } = useContext(SearchContext)
    const admin = localStorage.getItem('role')
    const [menuOpen, setMenuOpen] = useState(false)


    const [showProfileMenu, setShowProfileMenu] = useState(false)

    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchTerm(searchnav);
            navigate('/shop')
        }
    }

    function handleImgeClick() {
        setSearchTerm('')
        navigate('/shop')
    }

    function shopRefresh() {
        setSearchTerm('');
        navigate('/shop');
    }

    function handleLogout() {
        localStorage.clear();
        setShowProfileMenu(false);
        navigate('/login');
        window.location.reload();
    }

    return (
        <div className='main-navbar-container'>
            <div className='navbar-container'>


                <div className='brand-desktop'>
                    <NavLink to="/" style={{ textDecoration: 'none' }}>
                        Xenfit.
                    </NavLink>
                </div>

                <div className="hambarg">
                    <svg
                        className="burger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>

                    <div className={`left-navbar ${menuOpen ? 'open' : ''}`}>
                        <svg
                            className="burger inside-burger"
                            onClick={() => setMenuOpen(false)}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>


                        <div className='brand-mobile'>
                            <NavLink to="/" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                                Xenfit
                            </NavLink>
                        </div>

                        <div className='shop'>
                            <NavLink to={'/shop'} onClick={() => { shopRefresh(); setMenuOpen(false); }}>Shop</NavLink>
                        </div>
                        <div className='myorders'>
                            <NavLink to={'/myorders'} onClick={() => setMenuOpen(false)}>My Orders</NavLink>
                        </div>
                        <div className='about'>
                            <NavLink to={'/about'} onClick={() => setMenuOpen(false)}>About</NavLink>
                        </div>
                    </div>
                </div>

                <div className='right-navbar'>
                    <div className='serach-bar'>
                        <input type="text"
                            placeholder="Search..."
                            value={searchnav}
                            onChange={(e) => setSearchnav(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <img src={search} alt="Search" onClick={handleImgeClick} />
                    </div>
                    <div className="whishlist">
                        <NavLink to={'/whishlist'} >
                            <img src={whishlist} alt="Wishlist" />
                        </NavLink>
                        <div className="whislistcouter">
                            <p className='whishlistcount'>{Whishlistcount}</p>
                        </div>
                    </div>
                    <div className="cart">
                        <NavLink to={'/cart'} >
                            <img src={cart} alt="Cart" />
                        </NavLink>
                        <div className="cartcouter">
                            <p className='cartcount'>{cartcount}</p>
                        </div>
                    </div>

                    {
                        userId &&
                        <div className="account" style={{ position: 'relative' }}>
                            <div
                                className="account-btn"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                style={{ cursor: 'pointer' }}
                            >
                                <button className='btn'><span>Hi, {userId} </span></button>
                                <img className='account-img' src={account} alt="Account" />
                            </div>


                            {showProfileMenu && (
                                <div className="profile-dropdown-menu">
                                    <NavLink to="/profile" onClick={() => setShowProfileMenu(false)} className="dropdown-item">
                                        <FaUser className="dropdown-icon" /> Profile
                                    </NavLink>

                                    <NavLink to="/addresses" onClick={() => setShowProfileMenu(false)} className="dropdown-item">
                                        <FaMapMarkerAlt className="dropdown-icon" /> Addresses
                                    </NavLink>

                                    {admin === 'admin' && (
                                        <NavLink to="/admin" onClick={() => setShowProfileMenu(false)} className="dropdown-item">
                                            <FaUserShield className="dropdown-icon" /> Admin
                                        </NavLink>
                                    )}

                                    <div onClick={handleLogout} className="dropdown-item logout">
                                        <FaSignOutAlt className="dropdown-icon" /> Logout
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    {
                        !userId &&
                        <div className="login">
                            <NavLink to={'/login'} >
                                <button><span>Login</span></button>
                            </NavLink>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default Navbar