import axios from 'axios'
import React, { createContext, useState, useEffect, useCallback } from 'react'
import { toast } from "react-toastify";

export const CartContext = createContext()

export function CartProvider({ children }) {
    const [cartcount, setCartcount] = useState(0)

    const getApiUrl = () => {
        try {
            return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        } catch (e) {
            return 'http://127.0.0.1:8000/api';
        }
    };
    const API_URL = getApiUrl();

    const updateCartCount = useCallback(() => {
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('id');

        if (userId && token) {
            axios.get(`${API_URL}/orders/cart/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                setCartcount(res.data.items ? res.data.items.length : 0)
            })
            .catch((err) => console.error("Cart fetch error:", err))
        } else {
            setCartcount(0);
        }
    }, [API_URL])

    async function CartHandleChange(product) {
        
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('id');

        if (!userId) {
            toast.error("Please log in to add to cart", {
                position: 'top-right',
                autoClose: 1300,
            })
            return
        }

        try {
            await axios.post(`${API_URL}/orders/cart/add/`, 
                { 
                    product_id: product.id,
                    size: product.selectedSize  
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            toast.success('Item added to Bag', {
                position: 'top-right',
                autoClose: 1300,

            })
            updateCartCount()
        } catch (err) {
            console.error(err)

            
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                toast.error("Your account is blocked or session expired.", {
                    position: 'top-right',
                    autoClose: 2000,
                    theme: "dark",
                });
                return;
            }

            toast.error("Failed to add to cart")
        }
    }

    useEffect(() => {
        updateCartCount()
    }, [updateCartCount])

    return (
        <CartContext.Provider value={{ cartcount, updateCartCount, CartHandleChange }}>
            {children}
        </CartContext.Provider>
    )
}

export default CartProvider