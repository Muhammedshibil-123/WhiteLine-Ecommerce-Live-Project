import axios from "axios";
import { useState, useEffect, useContext } from "react";
import './cart.css';
import { useNavigate } from "react-router-dom";
import { CartContext } from "../component/cartcouter";
import { toast } from "react-toastify";

const defaultCartSummary = {
  original_subtotal: '0.00',
  subtotal: '0.00',
  bulk_savings: '0.00',
  discount: '0.00',
  gst: '0.00',
  grand_total: '0.00',
};

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(defaultCartSummary);
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
  const BASE_URL = API_URL.replace('/api', '');

  const formatCurrency = (value) => (
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  );

  const fetchCart = () => {
    if (token) {
      axios.get(`${API_URL}/orders/cart/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          setCartItems(res.data.items || []);
          setCartSummary({
            original_subtotal: res.data.original_subtotal || '0.00',
            subtotal: res.data.subtotal || '0.00',
            bulk_savings: res.data.bulk_savings || '0.00',
            discount: res.data.discount || '0.00',
            gst: res.data.gst || '0.00',
            grand_total: res.data.grand_total || '0.00',
          });
        })
        .catch((err) => console.log(err));
    }
  };

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

  function orderhandle() {
    const unsizedItems = cartItems.filter(item => !item.size && item.product?.sizes?.length);

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
                return img.startsWith('http') ? img : `${BASE_URL}${img}`;
              };

              const bulkApplied = item.bulk_applied && Number(item.bulk_discount_total || 0) > 0;

              return (
                <div className="cartdiv" key={item.id}>
                  <div className="product-info-col">
                    <img src={getImageUrl(item.product.image)} alt={item.product.title} />
                    <div className="product-text">
                      <h3>{item.product.title}</h3>
                      <p className="size-text">{item.product.brand}</p>
                      {bulkApplied && item.bulk_label && (
                        <p className="size-text" style={{ marginTop: '6px', color: '#2d6a4f' }}>
                          {item.bulk_label}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="size-selector">
                    <select
                      value={item.size || ""}
                      onChange={(e) => handleSizeChange(item.id, e.target.value)}
                      style={{
                        padding: '8px',
                        border: item.size ? '1px solid #ddd' : '1px solid #e63946',
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
                    {!item.size && <span style={{ display: 'block', fontSize: '10px', color: '#e63946', marginTop: '4px' }}>Required</span>}
                  </div>

                  <div className="price" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bulkApplied && (
                      <span style={{ textDecoration: 'line-through', color: '#8b8b8b', fontSize: '13px' }}>
                        {formatCurrency(item.original_unit_price)}
                      </span>
                    )}
                    <span>{formatCurrency(item.unit_price)}</span>
                  </div>

                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.max_stock)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.max_stock)}>+</button>
                  </div>

                  <div className="total-price" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bulkApplied && (
                      <span style={{ textDecoration: 'line-through', color: '#8b8b8b', fontSize: '13px' }}>
                        {formatCurrency(item.original_line_total)}
                      </span>
                    )}
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>

                  <button className="remove-btn" onClick={() => removeitem(item.id)}>
                    Remove
                  </button>
                </div>
              );
            })}

            <div className="pay">
              <div className="subtotal-info">
                <span>Subtotal</span>
                <div style={{ textAlign: 'right' }}>
                  {Number(cartSummary.bulk_savings || 0) > 0 && (
                    <div style={{ textDecoration: 'line-through', color: '#8b8b8b', fontSize: '14px' }}>
                      {formatCurrency(cartSummary.original_subtotal)}
                    </div>
                  )}
                  <h1>{formatCurrency(cartSummary.subtotal)}</h1>
                </div>
              </div>
              {Number(cartSummary.bulk_savings || 0) > 0 && (
                <p className="shipping-note" style={{ marginBottom: '8px' }}>
                  Bulk savings applied: - {formatCurrency(cartSummary.bulk_savings)}
                </p>
              )}
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
