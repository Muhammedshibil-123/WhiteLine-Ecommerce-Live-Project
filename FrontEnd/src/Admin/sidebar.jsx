import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './sidebar.css'

function Sidebar() {
    const navigate = useNavigate()

    function handlelogout() {
        navigate('/login')
        localStorage.clear()
    }
    
    return (
        <div className="admin-layout">
            <div className='admin-container'>
                <div className="main-sidebar">
                    <h1>WHITELINE.</h1>
                    
                    <div className='text-div'>
                        <NavLink to={'/admin'} className='nav' end>
                            <p>Dashboard</p>
                        </NavLink>
                        <NavLink to={'/admin/users'} className='nav'>
                            <p>Users</p>
                        </NavLink>
                        <NavLink to={'/admin/products'} className='nav'>
                            <p>Products</p>
                        </NavLink>
                        <NavLink to={'/admin/orders'} className='nav'>
                            <p>Orders</p>
                        </NavLink>
                        <NavLink to={'/admin/reviews'} className='nav'>
                            <p>Reviews</p>
                        </NavLink>
                        <NavLink to={'/'} className='nav'>
                            <p>Visit Store</p>
                        </NavLink>
                    </div>
                    
                    <button onClick={handlelogout}>LOGOUT</button>
                </div>
                
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Sidebar
