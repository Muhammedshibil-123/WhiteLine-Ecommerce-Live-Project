import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('username');
        if (storedUser) {
            setUser({
                id: localStorage.getItem('id'),
                username: storedUser,
                email: localStorage.getItem('email'),
                role: localStorage.getItem('role'),
                mobile: localStorage.getItem('mobile'),
            });
        }
        setLoading(false);
    }, []);

    const login = (data) => {
       
        setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
            mobile: data.mobile,
        });

        
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('id', data.id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
        if(data.mobile) localStorage.setItem('mobile', data.mobile);
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);