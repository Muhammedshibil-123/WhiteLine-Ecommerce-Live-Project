import axios from "axios";
import { useState, useEffect, useContext } from "react";
import './checkout.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CartContext } from "../component/cartcouter";

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]); 
  const [selectedAddressId, setSelectedAddressId] = useState(null); 
  const [paymentMethod, setPaymentMethod] = useState('online'); // New State for Payment Method
  
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const { updateCartCount } = useContext(CartContext);

  const API_URL = import.meta.env.VITE_API_URL;

  // 1. Fetch Cart & Addresses
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch Cart
    axios.get(`${API_URL}/orders/cart/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCartItems(res.data.items || []))
      .catch((err) => console.error(err));

    // Fetch Addresses
    axios.get(`${API_URL}/users/addresses/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setAddresses(res.data);
        const defaultAddr = res.data.find(addr => addr.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (res.data.length > 0) {
          setSelectedAddressId(res.data[0].id); 
        }
      })
      .catch((err) => console.error(err));

  }, [token, navigate, API_URL]);

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/150';
    return img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`;
  };

  // Calculations
  const totalCart = cartItems.reduce((total, item) => total + (item.quantity * Number(item.product.price)), 0);
  const discount = totalCart * 0.10;
  const discountedPrice = totalCart - discount;
  const gst = discountedPrice * 0.18;
  const grandprice = discountedPrice + gst;

  // 2. Handle Order Placement
  function orderhandle() {
    if (!selectedAddressId) {
      toast.warn('Please select a delivery address');
      return;
    }

    const selectedAddrObject = addresses.find(addr => addr.id === selectedAddressId);
    
    const deliveryData = {
        name: selectedAddrObject.name,
        mobile: selectedAddrObject.mobile,
        pincode: selectedAddrObject.pincode,
        address: selectedAddrObject.address,
        place: selectedAddrObject.city,
        landmark: selectedAddrObject.landmark
    };

    axios.post(`${API_URL}/orders/place-order/`, {
      total_amount: grandprice, 
      delivery_address: deliveryData,
      payment_method: paymentMethod // Send 'online' or 'cod'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        // --- CASE 1: CASH ON DELIVERY ---
        if (res.data.payment_method === 'cod') {
            toast.success("Order Placed Successfully!");
            updateCartCount();
            navigate('/myorders');
        } 
        // --- CASE 2: ONLINE PAYMENT (Razorpay) ---
        else {
            const { order_id, amount, key } = res.data;
            const options = {
              key: key,
              amount: amount,
              currency: "INR",
              name: "Whiteline",
              description: "Purchase Transaction",
              order_id: order_id, 
              handler: function (response) {
                verifyPayment(response);
              },
              prefill: {
                name: deliveryData.name,
                contact: deliveryData.mobile
              },
              theme: { color: "#3399cc" }
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response){
                toast.error(response.error.description);
            });
            rzp1.open();
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Order creation failed");
      });
  }

  const verifyPayment = (paymentData) => {
    axios.post(`${API_URL}/orders/verify-payment/`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        toast.success("Payment Successful!");
        updateCartCount();
        navigate('/myorders');
      })
      .catch((err) => {
        console.error(err);
        toast.error("Payment Verification Failed");
      });
  }

  return (
    <div className="main-checkout-conatainer">
      <div className="checkout-grid">
        
        {/* LEFT SIDE: ADDRESS SELECTION */}
        <div className="checkout-left">
          <div className="header-section">
            <h1>SELECT DELIVERY ADDRESS</h1>
            <div className="underline"></div>
          </div>

          <div className="address-selection-list">
            {addresses.length === 0 ? (
                <div className="no-address-warning">
                    <p>No addresses found.</p>
                </div>
            ) : (
                addresses.map((addr) => (
                    <div 
                        key={addr.id} 
                        className={`checkout-address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                    >
                        <div className="radio-container">
                            <input 
                                type="radio" 
                                name="address" 
                                checked={selectedAddressId === addr.id}
                                onChange={() => setSelectedAddressId(addr.id)}
                            />
                        </div>
                        <div className="address-info">
                            <div className="addr-header">
                                <h3>{addr.name}</h3>
                                <span className="addr-type">{addr.address_type}</span>
                            </div>
                            <p className="addr-text">{addr.address}, {addr.city}</p>
                            <p className="addr-pin">Pincode: <strong>{addr.pincode}</strong></p>
                            <p className="addr-mobile">Mobile: {addr.mobile}</p>
                        </div>
                    </div>
                ))
            )}

            <button className="add-addr-btn" onClick={() => navigate('/addresses')}>
                + ADD / EDIT ADDRESSES
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: SUMMARY */}
        <div className="checkout-right">
          <div className="summary-card">
            <h2>ORDER SUMMARY</h2>
            
            <div className="summary-items">
              {cartItems.length === 0 ? (
                <p>Your bag is empty</p>
              ) : (
                cartItems.map((item) => (
                  <div className="summary-item" key={item.id}>
                    <img src={getImageUrl(item.product.image)} alt={item.product.title} />
                    <div className="summary-info">
                      <h4>{item.product.title}</h4>
                      <p className="size-text">Size: {item.size || "N/A"}</p>
                      <p className="qty-text">Qty: {item.quantity}</p>
                      <p className="price-text">₹{Number(item.product.price) * item.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="price-breakdown">
              <div className="row">
                <span>Subtotal</span>
                <span>₹{totalCart}</span>
              </div>
              <div className="row">
                <span>Discount (10%)</span>
                <span className="discount">- ₹{Math.round(discount)}</span>
              </div>
              <div className="row">
                <span>GST (18%)</span>
                <span>+ ₹{Math.round(gst)}</span>
              </div>
              <div className="divider"></div>
              <div className="row total">
                <span>Grand Total</span>
                <span>₹{Math.round(grandprice)}</span>
              </div>
            </div>

            {/* --- NEW PAYMENT METHOD SECTION --- */}
            <div className="payment-method-section">
                <h3>PAYMENT METHOD</h3>
                
                <div 
                    className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                >
                    <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'online'} 
                        onChange={() => setPaymentMethod('online')} 
                    />
                    <span>Online Payment (Razorpay)</span>
                </div>

                <div 
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                >
                    <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'cod'} 
                        onChange={() => setPaymentMethod('cod')} 
                    />
                    <span>Cash on Delivery</span>
                </div>
            </div>

            <button 
                className="place-order-btn" 
                onClick={orderhandle}
                disabled={addresses.length === 0}
            >
                PLACE ORDER
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Checkout;
