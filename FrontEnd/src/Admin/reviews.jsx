import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import './reviews.css'

const emptyForm = {
  id: null,
  product_id: '',
  user_id: '',
  rating: 5,
  title: '',
  comment: '',
  status: 'approved',
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
  const token = localStorage.getItem('access_token') || localStorage.getItem('access')

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token])

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const [reviewsRes, usersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/products/reviews/admin/`, { headers: authHeaders }),
        axios.get(`${API_URL}/users/`, { headers: authHeaders }),
        axios.get(`${API_URL}/products/`),
      ])

      setReviews(reviewsRes.data || [])
      setUsers(usersRes.data || [])
      setProducts(productsRes.data || [])
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

  const openCreateModal = () => {
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const openEditModal = (review) => {
    setForm({
      id: review.id,
      product_id: review.product,
      user_id: review.user,
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      status: review.status || 'approved',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setForm(emptyForm)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!form.id && (!form.product_id || !form.user_id)) {
      toast.error('Choose both a product and a reviewer.')
      return
    }

    setSaving(true)

    try {
      if (form.id) {
        await axios.patch(
          `${API_URL}/products/reviews/${form.id}/`,
          {
            rating: form.rating,
            title: form.title,
            comment: form.comment,
            status: form.status,
          },
          { headers: authHeaders }
        )
        toast.success('Review updated.')
      } else {
        await axios.post(
          `${API_URL}/products/reviews/admin/`,
          {
            product_id: Number(form.product_id),
            user_id: Number(form.user_id),
            rating: form.rating,
            title: form.title,
            comment: form.comment,
            status: form.status,
          },
          { headers: authHeaders }
        )
        toast.success('Review created.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      console.error('Error saving review:', err)
      toast.error(err.response?.data?.detail || 'Unable to save review.')
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="reviews-page-wrapper">
      <div className="reviews-header">
        <div>
          <h1>Review Management</h1>
          <p>Approve, hide, edit, or seed product reviews from the admin panel.</p>
        </div>

        <button className="reviews-primary-btn" onClick={openCreateModal}>
          Add Review
        </button>
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
        {loading ? (
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
                    <div className="reviews-rating-pill">{review.rating}/5</div>
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
                    </div>
                  </td>
                  <td>{review.created_at}</td>
                  <td>
                    <div className="reviews-actions">
                      <button className="table-action-btn" onClick={() => openEditModal(review)}>
                        Edit
                      </button>
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

      {isModalOpen && (
        <div className="reviews-modal-overlay" onClick={closeModal}>
          <div className="reviews-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reviews-modal-header">
              <div>
                <h2>{form.id ? 'Edit Review' : 'Create Review'}</h2>
                <p>{form.id ? 'Adjust rating or moderation state.' : 'Add a review for any product and user.'}</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>x</button>
            </div>

            <form className="reviews-form" onSubmit={handleSave}>
              {!form.id && (
                <>
                  <div className="reviews-field">
                    <label>Product</label>
                    <select
                      value={form.product_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title} - {product.color}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="reviews-field">
                    <label>Reviewer</label>
                    <select
                      value={form.user_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="reviews-field">
                <label>Rating</label>
                <div className="admin-rating-selector">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      className={`admin-rating-chip ${form.rating === rating ? 'active' : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, rating }))}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reviews-field">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Short summary of the review"
                />
              </div>

              <div className="reviews-field">
                <label>Comment</label>
                <textarea
                  rows="5"
                  value={form.comment}
                  onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Write the full review here"
                />
              </div>

              <div className="reviews-field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="approved">Approved</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="reviews-form-actions">
                <button type="button" className="reviews-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="reviews-primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews
