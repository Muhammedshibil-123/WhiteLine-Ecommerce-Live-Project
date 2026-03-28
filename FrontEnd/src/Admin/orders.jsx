import axios from 'axios'
import React, { useEffect, useState } from 'react'
import './orders.css'
import { toast } from "react-toastify";

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All') 
  const statusOptions = [
    "Order Placed", 
    "Shipped", 
    "Out for Delivery", 
    "Delivered"
  ];

  const fetchOrders = () => {
    const token = localStorage.getItem('access_token');

    axios.get(`${import.meta.env.VITE_API_URL}/orders/`, {
      headers: {
        "Authorization": `Bearer ${token}` 
      }
    })
      .then((res) => {
        setOrders(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        if (err.response && err.response.status === 401) {
            toast.error("Session expired. Please login again.");
        }
        setLoading(false);
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('access_token');
    try {
      const updatedOrders = orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);

      await axios.patch(`${import.meta.env.VITE_API_URL}/orders/${id}/`, 
        { status: newStatus },
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      toast.success(`Order #${id} marked as ${newStatus}`, {
        theme: "dark",
        autoClose: 2000
      });

    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
      fetchOrders(); 
    }
  }

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/150';
    return img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
  };

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const pendingCount = orders.filter(o => o.status !== 'Delivered').length;

  return ( 
   <div className='orders-page-wrapper'>
      
      <div className="orders-header">
        <div>
          <h1>Order Management</h1>
          <p>Manage and track customer orders</p>
        </div>
        
        <div className="header-actions" style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
            <div className="filter-container">
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                    style={{padding: '8px', borderRadius: '5px', border: '1px solid #ccc'}}
                >
                    <option value="All">All Statuses</option>
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            <div className="order-stats">
                <span>Pending Orders: <strong>{pendingCount}</strong></span>
            </div>
        </div>
      </div>

      <div className='orders-table-container'>
        {loading ? (
          <p className="loading-text">Loading orders...</p>
        ) : filteredOrders.length > 0 ? (
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>ID</th>
                <th style={{width: '220px'}}>Delivery Details</th> 
                <th>Products Ordered</th>
                <th>Total</th>
                <th>Date</th>
                <th style={{paddingLeft:'50px'}}>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusClass = order.status 
                  ? order.status.toLowerCase().replace(/\s/g, '-') 
                  : 'order-placed';
                
        
                const address = order.delivery_address || {};

                return (
                  <tr key={order.id}>
                    <td className="id-col">#{order.id}</td>
                    <td className="customer-col">
                      <div className="customer-info">
                        <span className="name" style={{fontWeight: 'bold', display: 'block'}}>
                            {address.name || order.username}
                        </span>
                        <div style={{fontSize: '0.85rem', color: '#555', marginTop: '5px'}}>
                            <p style={{margin: 0}}>{address.address}</p>
                            <p style={{margin: 0}}>{address.landmark}</p>
                            <p style={{margin: 0}}>{address.pincode}</p>
                        </div>
                        <span className="sub-text" style={{color: '#007bff', display: 'block', marginTop: '4px'}}>
                            {address.mobile}
                        </span>
                      </div>
                    </td>

                    <td className="items-col">
                      <div className="items-list-detailed">
                        {order.items && order.items.map((item, idx) => (
                           <div key={idx} className="item-row-detail">
                              <img 
                                src={getImageUrl(item.product_image)} 
                                alt={item.product_title} 
                                onError={(e) => {e.target.src = 'https://via.placeholder.com/50'}}
                              />
                              <div className="item-text">
                                 <span className="item-title">{item.product_title}</span>
                                 <span className="item-qty">Qty: {item.quantity}</span>
                                 <span className="item-qty">Size: {item.size || 'N/A'}</span>
                              </div>
                           </div>
                        ))}
                      </div>
                    </td>

                    <td className="price-col">₹{order.total_amount}</td>
                    
                    <td className="date-col">{order.orderDate || 'N/A'}</td>

                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        {order.status || "Order Placed"}
                      </span>
                    </td>

                    <td>
                      <select 
                        className="status-select"
                        value={order.status || "Order Placed"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-orders">
             <p>No orders found matching the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;