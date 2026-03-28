import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import './reviews.css'

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
  const token = localStorage.getItem('access_token') || localStorage.getItem('access')
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const reviewsRes = await axios.get(`${API_URL}/products/reviews/admin/`, { headers: authHeaders })

      setReviews(reviewsRes.data || [])
    } catch (err) {
      console.error('Error loading review admin data:', err)
      toast.error('Unable to load reviews right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  const filteredReviews = reviews.filter((review) => {
    const query = search.toLowerCase()
    const matchesSearch =
      review.product_title?.toLowerCase().includes(query) ||
      review.user_name?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query) ||
      review.title?.toLowerCase().includes(query) ||
      review.id.toString().includes(query)

    const matchesStatus = statusFilter === 'all' || review.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return

    try {
      await axios.delete(`${API_URL}/products/reviews/${reviewId}/`, {
        headers: authHeaders,
      })
      setReviews((prev) => prev.filter((review) => review.id !== reviewId))
      toast.success('Review deleted.')
    } catch (err) {
      console.error('Error deleting review:', err)
      toast.error('Unable to delete review.')
    }
  }

  const renderStars = (rating) => (
    <div className="reviews-rating-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'filled' : ''}>
          &#9733;
        </span>
      ))}
      <span className="reviews-rating-value">{rating}/5</span>
    </div>
  )

  return (
    <div className="reviews-page-wrapper">
      <div className="reviews-header">
        <div>
          <h1>Review Management</h1>
          <p>View customer reviews and remove them when needed.</p>
        </div>
      </div>

      <div className="reviews-toolbar">
        <input
          type="text"
          placeholder="Search by product, reviewer, title, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="reviews-table-shell">
        {!token ? (
          <div className="reviews-empty-state">Admin login required to view reviews.</div>
        ) : loading ? (
          <div className="reviews-empty-state">Loading reviews...</div>
        ) : filteredReviews.length > 0 ? (
          <table className="reviews-admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>#{review.id}</td>
                  <td>{review.product_title}</td>
                  <td>{review.user_name}</td>
                  <td>
                    {renderStars(review.rating)}
                  </td>
                  <td>
                    <span className={`review-status-pill ${review.status}`}>
                      {review.status}
                    </span>
                  </td>
                  <td>
                    <div className="reviews-comment-cell">
                      {review.title && <strong>{review.title}</strong>}
                      <p>{review.comment || 'No comment added.'}</p>
                      {review.images?.length > 0 && (
                        <div className="reviews-image-grid">
                          {review.images.map((image) => (
                            <img
                              key={image.id}
                              src={image.image}
                              alt={`${review.user_name} review`}
                              className="reviews-image-thumb"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{review.created_at}</td>
                  <td>
                    <div className="reviews-actions">
                      <button
                        className="table-action-btn danger"
                        onClick={() => handleDelete(review.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="reviews-empty-state">No reviews match the current filter.</div>
        )}
      </div>
    </div>
  )
}

export default Reviews
