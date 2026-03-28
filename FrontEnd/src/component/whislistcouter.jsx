import axios from 'axios';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from "react-toastify";

export const WishlistContext = createContext();

export function WhishlistProvider({ children }) {

    const [wishlist, setWishlist] = useState([]);
    const [Whishlistcount, setWhislistcount] = useState(0);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';


    const getAccessToken = () => {
        return localStorage.getItem('access_token');
    };

 
    const fetchWishlist = useCallback(() => {
        const token = getAccessToken();

        if (!token) {
            setWishlist([]);
            setWhislistcount(0);
            return;
        }

        axios.get(`${API_URL}/orders/wishlist/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            const products = res.data?.products || [];
            setWishlist(products);
            setWhislistcount(products.length);
        })
        .catch(err => {
            console.error("Wishlist fetch error:", err);
            setWishlist([]);
            setWhislistcount(0);
        });

    }, [API_URL]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

  
    const WishlistHandleChange = async (product) => {
        const token = getAccessToken();

        if (!token) {
            toast.error("Please log in to add to Wishlist", {
                position: 'top-center',
                autoClose: 1300,
                style: { marginTop: '60px' }
            });
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/orders/wishlist/toggle/`,
                { product_id: product.id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const action = response.data.action;

            if (action === 'added') {
                setWishlist(prev => [...prev, product]);
                setWhislistcount(prev => prev + 1);
                toast.success("Added to Wishlist");
            } else {
                setWishlist(prev => prev.filter(item => item.id !== product.id));
                setWhislistcount(prev => prev - 1);
                toast.warn("Removed from Wishlist");
            }

        } catch (err) {
            console.error("Wishlist toggle error:", err);

            if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
            } else {
                toast.error("Failed to update wishlist");
            }
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            Whishlistcount,
            WishlistHandleChange,
            updateWhislistCount: fetchWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export default WhishlistProvider;
