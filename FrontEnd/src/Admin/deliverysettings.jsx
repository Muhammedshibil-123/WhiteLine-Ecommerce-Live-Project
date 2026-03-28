import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiMapPin, FiNavigation, FiSave, FiTruck } from 'react-icons/fi'

import './deliverysettings.css'

const defaultForm = {
  warehouse_pincode: '',
  rate_per_km: '',
}

function DeliverySettings() {
  const [formData, setFormData] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewPincode, setPreviewPincode] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const token = localStorage.getItem('access_token') || localStorage.getItem('access')

  const getApiUrl = () => {
    try {
      return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
    } catch (e) {
      return 'http://127.0.0.1:8000/api'
    }
  }

  const API_URL = getApiUrl()

  const formatCurrency = (value) => (
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  )

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/delivery-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setFormData({
        warehouse_pincode: response.data.warehouse_pincode || '',
        rate_per_km: response.data.rate_per_km || '',
      })
    } catch (error) {
      console.error(error)
      toast.error('Unable to load delivery settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchSettings()
    }
  }, [token])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    if (name === 'warehouse_pincode' && !/^\d*$/.test(value)) return
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (formData.warehouse_pincode.length !== 6) {
      toast.warning('Warehouse pincode must be 6 digits')
      return
    }

    setSaving(true)
    try {
      const response = await axios.patch(
        `${API_URL}/orders/delivery-settings/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setFormData({
        warehouse_pincode: response.data.warehouse_pincode || '',
        rate_per_km: response.data.rate_per_km || '',
      })
      toast.success('Delivery settings updated')
    } catch (error) {
      console.error(error)
      toast.error(
        error.response?.data?.warehouse_pincode?.[0] ||
        error.response?.data?.rate_per_km?.[0] ||
        error.response?.data?.detail ||
        'Unable to update delivery settings'
      )
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (e) => {
    e.preventDefault()

    if (previewPincode.length !== 6) {
      toast.warning('Enter a 6-digit pincode to test delivery pricing')
      return
    }

    setPreviewLoading(true)
    try {
      const response = await axios.get(`${API_URL}/orders/delivery-estimate/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { pincode: previewPincode },
      })
      setPreviewData(response.data)
    } catch (error) {
      console.error(error)
      setPreviewData(null)
      toast.error(error.response?.data?.error || 'Unable to calculate delivery for that pincode')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return <div className="delivery-settings-page">Loading delivery settings...</div>
  }

  return (
    <div className="delivery-settings-page">
      <div className="delivery-settings-header">
        <div>
          <h1>Delivery Settings</h1>
          <p>Set the warehouse pincode and a flat charge per kilometer for every delivery.</p>
        </div>
      </div>

      <div className="delivery-settings-grid">
        <section className="delivery-card">
          <div className="delivery-card-title">
            <FiTruck />
            <h2>Warehouse Pricing</h2>
          </div>

          <form onSubmit={handleSave} className="delivery-form">
            <label>
              Warehouse Pincode
              <div className="delivery-input-wrap">
                <FiMapPin />
                <input
                  type="text"
                  name="warehouse_pincode"
                  value={formData.warehouse_pincode}
                  onChange={handleFormChange}
                  maxLength="6"
                  placeholder="Enter warehouse pincode"
                  required
                />
              </div>
            </label>

            <label>
              Rate Per Kilometer
              <div className="delivery-input-wrap">
                <FiNavigation />
                <input
                  type="number"
                  name="rate_per_km"
                  value={formData.rate_per_km}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="Example: 8"
                  required
                />
              </div>
            </label>

            <button type="submit" className="delivery-save-btn" disabled={saving}>
              <FiSave />
              {saving ? 'Saving...' : 'Save Delivery Rules'}
            </button>
          </form>
        </section>

        <section className="delivery-card">
          <div className="delivery-card-title">
            <FiNavigation />
            <h2>Test A Pincode</h2>
          </div>

          <form onSubmit={handlePreview} className="delivery-form">
            <label>
              Customer Pincode
              <div className="delivery-input-wrap">
                <FiMapPin />
                <input
                  type="text"
                  value={previewPincode}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return
                    setPreviewPincode(e.target.value)
                  }}
                  maxLength="6"
                  placeholder="Enter destination pincode"
                />
              </div>
            </label>

            <button type="submit" className="delivery-preview-btn" disabled={previewLoading}>
              {previewLoading ? 'Calculating...' : 'Calculate Delivery'}
            </button>
          </form>

          {previewData && (
            <div className="delivery-preview-box">
              <div className="delivery-preview-row">
                <span>Warehouse</span>
                <strong>{previewData.warehouse_pincode}</strong>
              </div>
              <div className="delivery-preview-row">
                <span>Destination</span>
                <strong>{previewData.destination_pincode}</strong>
              </div>
              <div className="delivery-preview-row">
                <span>Distance</span>
                <strong>{previewData.distance_km} km</strong>
              </div>
              <div className="delivery-preview-row">
                <span>Rate</span>
                <strong>{formatCurrency(previewData.rate_per_km)} / km</strong>
              </div>
              <div className="delivery-preview-row total">
                <span>Delivery Charge</span>
                <strong>{formatCurrency(previewData.delivery_charge)}</strong>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DeliverySettings
