import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiImage, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi'

import './generalsettings.css'

const defaultHomeImages = {
  home_hero_image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
  home_category_oversized_image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1887&auto=format&fit=crop',
  home_category_minimal_image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1887&auto=format&fit=crop',
  home_category_printed_image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=1887&auto=format&fit=crop',
}

const imageSlots = [
  { field: 'home_hero_image', title: 'Hero Banner', description: 'Top hero background image' },
  { field: 'home_category_oversized_image', title: 'Category Card 1', description: 'Oversized category image' },
  { field: 'home_category_minimal_image', title: 'Category Card 2', description: 'Minimal category image' },
  { field: 'home_category_printed_image', title: 'Category Card 3', description: 'Printed category image' },
]

function GeneralSettings() {
  const [settingsData, setSettingsData] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const token = localStorage.getItem('access_token') || localStorage.getItem('access')

  const getApiUrl = () => {
    try {
      return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
    } catch (e) {
      return 'http://127.0.0.1:8000/api'
    }
  }

  const API_URL = getApiUrl()

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/general-settings/`)
      setSettingsData(response.data || {})
    } catch (error) {
      console.error(error)
      toast.error('Unable to load general settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleFileChange = (field, file) => {
    if (!file) return

    setSelectedFiles((prev) => {
      if (prev[field]?.preview) {
        URL.revokeObjectURL(prev[field].preview)
      }

      return {
        ...prev,
        [field]: {
          file,
          preview: URL.createObjectURL(file),
        }
      }
    })
  }

  const handleSave = async () => {
    const fieldsToUpload = Object.keys(selectedFiles)
    if (!fieldsToUpload.length) {
      toast.info('Select at least one image before saving')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      fieldsToUpload.forEach((field) => {
        formData.append(field, selectedFiles[field].file)
      })

      const response = await axios.patch(`${API_URL}/orders/general-settings/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      })

      Object.values(selectedFiles).forEach((entry) => {
        if (entry?.preview) {
          URL.revokeObjectURL(entry.preview)
        }
      })

      setSelectedFiles({})
      setSettingsData(response.data || {})
      toast.success('Homepage images updated')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Unable to save homepage images')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (field) => {
    try {
      const formData = new FormData()
      formData.append('remove_fields', field)

      const response = await axios.patch(`${API_URL}/orders/general-settings/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSelectedFiles((prev) => {
        if (prev[field]?.preview) {
          URL.revokeObjectURL(prev[field].preview)
        }
        const nextState = { ...prev }
        delete nextState[field]
        return nextState
      })

      setSettingsData(response.data || {})
      toast.success('Custom image removed. Storefront is back on fallback image.')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Unable to remove image')
    }
  }

  const getPreviewSrc = (field) => {
    if (selectedFiles[field]?.preview) {
      return selectedFiles[field].preview
    }
    return settingsData[field] || defaultHomeImages[field]
  }

  const hasCustomImage = (field) => Boolean(settingsData[field])

  if (loading) {
    return <div className="general-settings-page">Loading general settings...</div>
  }

  return (
    <div className="general-settings-page">
      <div className="general-settings-header">
        <div>
          <h1>General Settings</h1>
          <p>Manage the homepage visuals. If a slot has no custom image, the storefront keeps the built-in fallback image.</p>
        </div>
        <button className="general-save-btn" onClick={handleSave} disabled={saving}>
          <FiSave />
          {saving ? 'Saving...' : 'Save Uploaded Images'}
        </button>
      </div>

      <div className="general-settings-grid">
        {imageSlots.map((slot) => (
          <section className="general-image-card" key={slot.field}>
            <div className="general-image-head">
              <div>
                <h2>{slot.title}</h2>
                <p>{slot.description}</p>
              </div>
              <span className={`general-image-status ${hasCustomImage(slot.field) ? 'custom' : 'fallback'}`}>
                {hasCustomImage(slot.field) ? 'Custom' : 'Fallback'}
              </span>
            </div>

            <div className="general-image-preview">
              <img src={getPreviewSrc(slot.field)} alt={slot.title} />
            </div>

            <div className="general-image-actions">
              <label className="general-upload-btn">
                <FiImage />
                Replace Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(slot.field, e.target.files?.[0])}
                />
              </label>

              <button
                type="button"
                className="general-remove-btn"
                onClick={() => handleRemove(slot.field)}
                disabled={!hasCustomImage(slot.field)}
              >
                <FiTrash2 />
                Remove Custom
              </button>
            </div>

            {selectedFiles[slot.field] && (
              <div className="general-pending-note">
                <FiRefreshCw />
                Ready to upload on save
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export default GeneralSettings
