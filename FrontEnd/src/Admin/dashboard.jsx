import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './dashboard.css'
import { FaUserFriends, FaBoxOpen, FaShoppingBag, FaRupeeSign } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const AnimatedCounter = ({ value, isCurrency = false }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    const end = parseInt(value, 10) || 0
    const duration = 1000

    if (end === 0) {
      setCount(0)
      return
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = currentTime - startTime
      const percentage = Math.min(progress / duration, 1)
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage)
      const current = Math.floor(ease * end)
      setCount(current)

      if (progress < duration) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span>
      {isCurrency ? '₹' : ''}
      {count.toLocaleString()}
    </span>
  )
}

function Dashbaord() {
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  const token = localStorage.getItem('access_token') || localStorage.getItem('access')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authConfig = {
          headers: { Authorization: `Bearer ${token}` }
        }

        const [prodRes, userRes, orderRes] = await Promise.all([
          axios.get(`${API_URL}/products/`, authConfig),
          axios.get(`${API_URL}/users/`, authConfig),
          axios.get(`${API_URL}/orders/`, authConfig)
        ])

        setProducts(prodRes.data || [])
        setUsers(userRes.data || [])
        setOrders(orderRes.data || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token, API_URL])

  const totalIncome = orders.reduce((total, order) => {
    return total + parseFloat(order.total_amount || 0)
  }, 0)

  const recentOrders = [...orders].slice(0, 5)

  
  const topProducts = orders
    .reduce((acc, order) => {
      order.items.forEach((item) => {
        const existing = acc.find((p) => p.product_id === item.product_id)

        if (existing) {
          existing.sales += item.quantity
        } else {
          const originalProduct = products.find((p) => p.id === item.product_id)

          acc.push({
            product_id: item.product_id,
            title: item.product_title, 
            image: item.product_image,
            price: item.price,
            sales: item.quantity,
            category: originalProduct?.theme || 'General'
          })
        }
      })
      return acc
    }, [])
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 4)

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/150'
    if (img.startsWith('http')) return img
 
    return `http://127.0.0.1:8000${img}`
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div>
          <h1>Overview</h1>
          <p>Welcome back, Admin</p>
        </div>
        <div className="date-badge">{new Date().toDateString()}</div>
      </div>

      <div className="stats-grids">
        <div className="stat-cards">
          <div className="icon-box purple">
            <FaUserFriends />
          </div>
          <div className="stat-info">
            <h4>Total Users</h4>
            <h2>
              <AnimatedCounter value={users.length} />
            </h2>
          </div>
        </div>

        <div className="stat-cards">
          <div className="icon-box blue">
            <FaBoxOpen />
          </div>
          <div className="stat-info">
            <h4>Total Products</h4>
            <h2>
              <AnimatedCounter value={products.length} />
            </h2>
          </div>
        </div>

        <div className="stat-cards">
          <div className="icon-box orange">
            <FaShoppingBag />
          </div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <h2>
              <AnimatedCounter value={orders.length} />
            </h2>
          </div>
        </div>

        <div className="stat-cards">
          <div className="icon-box green">
            <FaRupeeSign />
          </div>
          <div className="stat-info">
            <h4>Total Revenue</h4>
            <h2>
              <AnimatedCounter value={totalIncome} isCurrency />
            </h2>
          </div>
        </div>
      </div>

      <div className="dashboard-split">
        <div className="recent-orders-section">
          <div className="section-header">
            <h3>Recent Orders</h3>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id}</td>
                      <td className="customer-name">
                        
                        {order.delivery_address?.name || order.username}
                      </td>
                      <td>{order.items.length} Items</td>
                      <td className="amount">₹{order.total_amount}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            order.status?.toLowerCase().replace(/\s/g, '-') ||
                            'pending'
                          }`}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="top-products-section">
          <div className="section-header">
            <h3>Top Selling</h3>
          </div>

          <div className="top-products-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div className="top-product-item" key={index}>
                  <div className="product-rank">0{index + 1}</div>
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/50'
                    }}
                  />
                  <div className="product-desc">
                    <h5>{product.title}</h5>
                    <p>{product.category}</p>
                  </div>
                  <div className="product-sales">
                    <span>{product.sales} sold</span>
                    <strong>₹{product.price}</strong>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                No sales data yet.
              </p>
            )}
          </div>

          <div className="view-all-btn">
            <button onClick={() => navigate('/admin/orders')}> View Orders</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashbaord