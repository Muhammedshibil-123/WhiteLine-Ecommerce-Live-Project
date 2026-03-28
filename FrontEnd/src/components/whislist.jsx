import axios from "axios";
import { useState, useEffect, useContext } from "react";
import './whislist.css'; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CartContext } from "../component/cartcouter";
import { WishlistContext } from "../component/whislistcouter";

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'; 
};

function Whislist() {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const navigate = useNavigate();
  const { updateCartCount } = useContext(CartContext);
  const { updateWhislistCount } = useContext(WishlistContext);
  
  const API_URL = getApiUrl(); 

  useEffect(() => {
    fetchWishlist();
  }, [API_URL]);

  const fetchWishlist = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/orders/wishlist/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistProducts(res.data.products || []);
    } catch (err) {
      console.log("Error fetching wishlist:", err);
    }
  };

  const removeproduct = async (productId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await axios.post(`${API_URL}/orders/wishlist/toggle/`, 
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      updateWhislistCount();
      
      toast.success("Removed from Wishlist", { autoClose: 1000 });
    } catch (err) {
      console.log(err);
      toast.error("Failed to remove product");
    }
  };

  async function CartHandleChange(product) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      toast.error("Please log in to add to cart");
      return;
    }

    try {
      await axios.post(`${API_URL}/orders/cart/add/`, 
        { 
          product_id: product.id,
          size: null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Moved to Bag', { autoClose: 1300 });
      
      updateCartCount();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to bag");
    }
  }

  return (
    <div className="main-wishlist-container">
      <div className="wishlist-content">
        <h1>YOUR WISHLIST</h1>
        
        {wishlistProducts.length === 0 ? (
          <div className="empty-wishlist">
            <p>Your wishlist is currently empty.</p>
            <button onClick={() => navigate('/shop')}>Continue Shopping</button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistProducts.map((product) => (
              <div className="wishlist-card" key={product.id}>
                <div className="card-image">
                  <img src={product.image} alt={product.title} />
                  <button 
                    className="remove-icon" 
                    onClick={() => removeproduct(product.id)}
                    title="Remove from Wishlist"
                  >
                    ×
                  </button>
                </div>
                
                <div className="card-details">
                  <h3>{product.title}</h3>
                  <p className="price">₹{product.price}</p>
                  
                  <button 
                    className="move-to-bag-btn" 
                    onClick={() => CartHandleChange(product)}
                  >
                    MOVE TO BAG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Whislist;