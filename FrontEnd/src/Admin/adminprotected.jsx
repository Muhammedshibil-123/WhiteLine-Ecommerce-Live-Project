import React from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'


function Adminprotected() {
    const navigate = useNavigate()
    const role=localStorage.getItem('role')

    if(role==='admin'){
        return <Outlet/>
    }
    return <Navigate to={'/' } replace/>

}

export default Adminprotected