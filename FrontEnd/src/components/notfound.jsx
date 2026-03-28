import React from 'react'
import { NavLink } from 'react-router-dom'


function Notfound() {
  return (
     <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <NavLink to="/" style={{ textDecoration: 'none', color: 'red' }}>
        Go Back to Home
      </NavLink>
    </div>
  )
}

export default Notfound