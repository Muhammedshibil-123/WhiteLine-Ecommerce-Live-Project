import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiBox, FiShoppingCart, FiStar, FiLogOut, FiExternalLink, FiMapPin } from 'react-icons/fi'
import './sidebar.css'

function Sidebar() {
    const navigate = useNavigate()

    function handlelogout() {
        navigate('/login')
        localStorage.clear()
    }
    
    // Animation variants
    const sidebarVariants = {
        hidden: { x: "-100%" },
        visible: { 
            x: 0, 
            transition: { 
                type: "spring", 
                stiffness: 70, 
                damping: 15,
                when: "beforeChildren",
                staggerChildren: 0.1
            } 
        }
    };

    const linkVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="admin-layout">
            <div className='admin-container'>
                <motion.div 
                    className="main-sidebar"
                    initial="hidden"
                    animate="visible"
                    variants={sidebarVariants}
                >
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        WHITELINE.
                    </motion.h1>
                    
                    <div className='text-div'>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin'} className='nav' end>
                                <p><FiHome className="nav-icon" /> Dashboard</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin/users'} className='nav'>
                                <p><FiUsers className="nav-icon" /> Users</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin/products'} className='nav'>
                                <p><FiBox className="nav-icon" /> Products</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin/orders'} className='nav'>
                                <p><FiShoppingCart className="nav-icon" /> Orders</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin/delivery'} className='nav'>
                                <p><FiMapPin className="nav-icon" /> Delivery</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/admin/reviews'} className='nav'>
                                <p><FiStar className="nav-icon" /> Reviews</p>
                            </NavLink>
                        </motion.div>
                        <motion.div variants={linkVariants}>
                            <NavLink to={'/'} className='nav store-link'>
                                <p><FiExternalLink className="nav-icon" /> Visit Store</p>
                            </NavLink>
                        </motion.div>
                    </div>
                    
                    <motion.button 
                        onClick={handlelogout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="logout-btn"
                    >
                        <FiLogOut className="logout-icon" /> LOGOUT
                    </motion.button>
                </motion.div>
                
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Sidebar
