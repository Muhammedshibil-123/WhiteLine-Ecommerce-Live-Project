import axios from "axios";
import { useState, useEffect, useContext } from "react";
import './checkout.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CartContext } from "../component/cartcouter";

const defaultPricingSummary = {
  original_subtotal: '0.00',
  subtotal: '0.00',
  bulk_savings: '0.00',
  discount: '0.00',
  grand_total: '0.00',
  delivery_charge: '0.00',
  distance_km: '0.00',
  rate_per_km: '0.00',
  warehouse_pincode: '',
  destination_pincode: '',
  payable_total: '0.00',
};

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [pricingSummary, setPricingSummary] = useState(defaultPricingSummary);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const { updateCartCount } = useContext(CartContext);

  const getApiUrl = () => {
    try {
      return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    } catch (e) {
      return 'http://127.0.0.1:8000/api';
    }
  };
  const API_URL = getApiUrl();

  const formatCurrency = (value) => (
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  );

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    axios.get(`${API_URL}/orders/cart/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setCartItems(res.data.items || []);
        setPricingSummary((prev) => ({
          ...prev,
          original_subtotal: res.data.original_subtotal || '0.00',
          subtotal: res.data.subtotal || '0.00',
          bulk_savings: res.data.bulk_savings || '0.00',
          discount: res.data.discount || '0.00',
          grand_total: res.data.grand_total || '0.00',
          payable_total: res.data.grand_total || '0.00',
        }));
      })
      .catch((err) => console.error(err));

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

  useEffect(() => {
    if (!token || !selectedAddressId) return;

    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
    if (!selectedAddress?.pincode) return;

    setDeliveryLoading(true);
    setDeliveryError('');

    axios.get(`${API_URL}/orders/delivery-estimate/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { pincode: selectedAddress.pincode },
    })
      .then((res) => {
        setPricingSummary((prev) => ({
          ...prev,
          ...res.data,
        }));
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.error || 'Unable to calculate delivery for the selected pincode';
        setDeliveryError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => {
        setDeliveryLoading(false);
      });
  }, [selectedAddressId, addresses, token, API_URL]);

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/150';
    return img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`;
  };

  function orderhandle() {
    if (!cartItems.length) {
      toast.warn('Your bag is empty');
      return;
    }

    const unsizedItems = cartItems.filter(item => !item.size && item.product?.sizes?.length);
    if (unsizedItems.length > 0) {
      toast.warn('Please select a size for all items before placing the order');
      return;
    }

    if (!selectedAddressId) {
      toast.warn('Please select a delivery address');
      return;
    }

    if (deliveryLoading) {
      toast.info('Calculating delivery charge, please wait');
      return;
    }

    if (deliveryError) {
      toast.error(deliveryError);
      return;
    }

    const selectedAddrObject = addresses.find(addr => addr.id === selectedAddressId);

    const deliveryData = {
      name: selectedAddrObject.name,
      mobile: selectedAddrObject.mobile,
      pincode: selectedAddrObject.pincode,
      address: selectedAddrObject.address,
      landmark: selectedAddrObject.landmark
    };

    axios.post(`${API_URL}/orders/place-order/`, {
      total_amount: pricingSummary.payable_total,
      delivery_address: deliveryData,
      payment_method: paymentMethod
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.data.payment_method === 'cod') {
          toast.success("Order Placed Successfully!");
          updateCartCount();
          navigate('/myorders');
        } else {
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
          rzp1.on('payment.failed', function (response) {
            toast.error(response.error.description);
          });
          rzp1.open();
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.error || "Order creation failed");
      });
  }

  const verifyPayment = (paymentData) => {
    axios.post(`${API_URL}/orders/verify-payment/`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        toast.success("Payment Successful!");
        updateCartCount();
        navigate('/myorders');
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.error || "Payment Verification Failed");
      });
  };

  return (
    <div className="main-checkout-conatainer">
      <div className="checkout-grid">
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
                    <p className="addr-text">{addr.address}</p>
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

        <div className="checkout-right">
          <div className="summary-card">
            <h2>ORDER SUMMARY</h2>

            <div className="summary-items">
              {cartItems.length === 0 ? (
                <p>Your bag is empty</p>
              ) : (
                cartItems.map((item) => {
                  const bulkApplied = item.bulk_applied && Number(item.bulk_discount_total || 0) > 0;

                  return (
                    <div className="summary-item" key={item.id}>
                      <img src={getImageUrl(item.product.image)} alt={item.product.title} />
                      <div className="summary-info">
                        <h4>{item.product.title}</h4>
                        <p className="size-text">Size: {item.size || "N/A"}</p>
                        <p className="qty-text">Qty: {item.quantity}</p>
                        {bulkApplied && item.bulk_label && (
                          <p className="qty-text" style={{ color: '#2d6a4f' }}>{item.bulk_label}</p>
                        )}
                        <div className="price-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {bulkApplied && (
                            <span style={{ textDecoration: 'line-through', color: '#8b8b8b', fontSize: '13px' }}>
                              {formatCurrency(item.original_line_total)}
                            </span>
                          )}
                          <span>{formatCurrency(item.line_total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {deliveryLoading && (
              <p style={{ margin: '0 0 12px', color: '#555', fontSize: '13px' }}>
                Calculating delivery charge for the selected pincode...
              </p>
            )}

            {pricingSummary.warehouse_pincode && !deliveryError && (
              <p style={{ margin: '0 0 12px', color: '#555', fontSize: '13px' }}>
                Warehouse {pricingSummary.warehouse_pincode} to {pricingSummary.destination_pincode}: {pricingSummary.distance_km} km
              </p>
            )}

            {deliveryError && (
              <p style={{ margin: '0 0 12px', color: '#d62828', fontSize: '13px' }}>
                {deliveryError}
              </p>
            )}

            <div className="price-breakdown">
              <div className="row">
                <span>Subtotal</span>
                <span>{formatCurrency(pricingSummary.original_subtotal)}</span>
              </div>
              {Number(pricingSummary.bulk_savings || 0) > 0 && (
                <div className="row">
                  <span>Bulk Savings</span>
                  <span className="discount">- {formatCurrency(pricingSummary.bulk_savings)}</span>
                </div>
              )}
              <div className="row">
                <span>Discount (10%)</span>
                <span className="discount">- {formatCurrency(pricingSummary.discount)}</span>
              </div>
              <div className="row">
                <span>Delivery Charge</span>
                <span>+ {formatCurrency(pricingSummary.delivery_charge)}</span>
              </div>
              <div className="divider"></div>
              <div className="row total">
                <span>Grand Total</span>
                <span>{formatCurrency(pricingSummary.payable_total)}</span>
              </div>
            </div>

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
              disabled={addresses.length === 0 || cartItems.length === 0 || deliveryLoading || Boolean(deliveryError)}
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
