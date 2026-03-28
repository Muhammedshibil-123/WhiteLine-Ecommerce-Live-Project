import axios from "axios";
import { useState, useEffect, useContext } from "react";
import './cart.css';
import { useNavigate } from "react-router-dom";
import { CartContext } from "../component/cartcouter";
import { toast } from "react-toastify";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const { updateCartCount } = useContext(CartContext);
  const token = localStorage.getItem('access_token');

  const getApiUrl = () => {
      try {
          return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      } catch (e) {
          return 'http://127.0.0.1:8000/api';
      }
  };
  const API_URL = getApiUrl();


  const fetchCart = () => {
    if(token) {
        axios.get(`${API_URL}/orders/cart/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            setCartItems(res.data.items || []);
        })
        .catch((err) => console.log(err));
    }
  }

  useEffect(() => {
    fetchCart();
  }, [token]);

  function removeitem(id) {
    axios.delete(`${API_URL}/orders/cart/item/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
        fetchCart();
        updateCartCount();
        toast.info("Item removed");
    })
    .catch((err) => console.log(err));
  }

  function updateQuantity(id, newQty, currentSize, maxStock) {
      if (newQty < 1) return;
      
    
      if (currentSize && maxStock > 0 && newQty > maxStock) {
          toast.warn(`Only ${maxStock} items available in this size`);
          return;
      }

      axios.patch(`${API_URL}/orders/cart/item/${id}/`, 
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => fetchCart())
      .catch((err) => {
          toast.error(err.response?.data?.error || "Cannot update quantity");
      });
  }


  function handleSizeChange(id, newSize) {
      axios.patch(`${API_URL}/orders/cart/item/${id}/`, 
        { size: newSize },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => fetchCart())
      .catch((err) => {
          toast.error(err.response?.data?.error || "Stock not available for this size");
      });
  }


  const totalCart = cartItems.reduce((total, item) => {
    return total + (item.quantity * Number(item.product.price));
  }, 0);

  function orderhandle() {
    const unsizedItems = cartItems.filter(item => !item.size);
    
    if (unsizedItems.length > 0) {
        toast.error("Please select a size for all items before checkout", {
            position: "top-center",
            theme: "dark"
        });
        return;
    }
    navigate('/checkout');
  }

  return (
    <div className="main-cart-conatainer">
      <div className="cart-container">
        <h1>YOUR BAG</h1>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart-msg">
            <p>Your bag is empty.</p>
            <button onClick={() => navigate('/shop')}>Start Shopping</button>
          </div>
        ) : (
          <div>
            <div className="cart-header">
                <span>Product</span>
                <span>Size</span> 
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span>Action</span>
            </div>

            {cartItems.map((item) => {
                const getImageUrl = (img) => {
                    if (!img) return 'https://via.placeholder.com/150';
                    return img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
                };

                return (
                  <div className="cartdiv" key={item.id}>
                    
                    <div className="product-info-col">
                        <img src={getImageUrl(item.product.image)} alt={item.product.title} />
                        <div className="product-text">
                            <h3>{item.product.title}</h3>
                            <p className="size-text">{item.product.brand}</p>
                        </div>
                    </div>

                
                    <div className="size-selector">
                        <select 
                            value={item.size || ""} 
                            onChange={(e) => handleSizeChange(item.id, e.target.value)}
                            style={{
                                padding: '8px', 
                                border: item.size ? '1px solid #ddd' : '1px solid #e63946', // Highlight if empty
                                outline: 'none'
                            }}
                        >
                            <option value="" disabled>Select Size</option>
                            {item.product.sizes && item.product.sizes.map((s) => (
                                <option 
                                    key={s.id} 
                                    value={s.size} 
                                    disabled={s.stock === 0}
                                >
                                    {s.size} {s.stock < 5 && s.stock > 0 ? `(Only ${s.stock} left)` : ''} {s.stock === 0 ? '(Out of Stock)' : ''}
                                </option>
                            ))}
                        </select>
                        {!item.size && <span style={{display:'block', fontSize:'10px', color:'#e63946', marginTop:'4px'}}>Required</span>}
                    </div>

                    <p className="price">₹{item.product.price}</p>

                    <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.max_stock)}>-</button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.max_stock)}>+</button>
                    </div>

                    <p className="total-price">₹{(Number(item.product.price) * item.quantity)}</p>

                    <button className="remove-btn" onClick={() => removeitem(item.id)}>
                        Remove
                    </button>
                  </div>
                )
            })}
            
            <div className="pay">
              <div className="subtotal-info">
                  <span>Subtotal</span>
                  <h1>₹{totalCart}</h1>
              </div>
              <p className="shipping-note">Taxes and shipping calculated at checkout</p>
              <button onClick={orderhandle}>CHECKOUT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;