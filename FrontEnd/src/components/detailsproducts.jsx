import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { CartContext } from '../component/cartcouter'
import backarrow from '../assets/back-arrow.png'
import shipping from '../assets/freeshipping.png'
import tick from '../assets/tick-home.png'
import './detailsproducts.css'

const defaultReviewForm = {
    rating: 5,
    title: '',
    comment: '',
}

const MAX_REVIEW_IMAGES = 4

function Detailsproducts() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { CartHandleChange } = useContext(CartContext)

    const [product, setProduct] = useState(null)
    const [selectedSize, setSelectedSize] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeImg, setActiveImg] = useState('')
    const [reviewForm, setReviewForm] = useState(defaultReviewForm)
    const [reviewRetainedImages, setReviewRetainedImages] = useState([])
    const [newReviewImages, setNewReviewImages] = useState([])
    const [submittingReview, setSubmittingReview] = useState(false)
    const newReviewImagesRef = useRef([])

    const token = localStorage.getItem('access_token')

    const getApiUrl = () => {
        try {
            return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
        } catch (e) {
            return 'http://127.0.0.1:8000/api'
        }
    }

    const API_URL = getApiUrl()

    const getBaseUrl = () => {
        try {
            const url = new URL(API_URL)
            return url.origin
        } catch (e) {
            return API_URL.split('/api')[0]
        }
    }

    const BASE_URL = getBaseUrl()

    useEffect(() => {
        newReviewImagesRef.current = newReviewImages
    }, [newReviewImages])

    useEffect(() => (
        () => {
            newReviewImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview))
        }
    ), [])

    const clearPendingReviewImages = () => {
        setNewReviewImages((prev) => {
            prev.forEach((image) => URL.revokeObjectURL(image.preview))
            return []
        })
    }

    const syncReviewForm = (productData) => {
        if (productData?.user_review) {
            setReviewForm({
                rating: productData.user_review.rating || 5,
                title: productData.user_review.title || '',
                comment: productData.user_review.comment || '',
            })
            setReviewRetainedImages(productData.user_review.images || [])
            clearPendingReviewImages()
            return
        }

        setReviewRetainedImages([])
        clearPendingReviewImages()
        setReviewForm(defaultReviewForm)
    }

    const fetchProduct = async () => {
        setLoading(true)

        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const res = await axios.get(`${API_URL}/products/${id}/`, { headers })

            setProduct(res.data)
            setActiveImg(res.data.image)
            setSelectedSize(null)
            syncReviewForm(res.data)
        } catch (err) {
            console.error('Error fetching product:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProduct()
    }, [id])

    const handleAddToCart = () => {
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            toast.error('Please select a size', {
                position: 'top-right',
                autoClose: 1500,
                hideProgressBar: true,
                theme: 'dark',
                style: { fontSize: '13px' },
            })
            return
        }

        CartHandleChange({ ...product, selectedSize })
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault()

        if (!token) {
            toast.error('Please login to submit a review.')
            navigate('/login')
            return
        }

        setSubmittingReview(true)

        try {
            const formData = new FormData()
            formData.append('rating', reviewForm.rating)
            formData.append('title', reviewForm.title)
            formData.append('comment', reviewForm.comment)
            formData.append('sync_images', 'true')

            reviewRetainedImages.forEach((image) => {
                formData.append('retain_image_ids', image.id)
            })

            newReviewImages.forEach(({ file }) => {
                formData.append('images', file)
            })

            const res = await axios.post(
                `${API_URL}/products/${id}/reviews/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            setProduct(res.data)
            syncReviewForm(res.data)
            toast.success(product?.user_review ? 'Review updated.' : 'Review added.')
        } catch (err) {
            console.error('Error submitting review:', err)
            const message = err.response?.data?.detail || 'Unable to save your review.'
            toast.error(message)
        } finally {
            setSubmittingReview(false)
        }
    }

    const handleReviewImageChange = (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const currentImageCount = reviewRetainedImages.length + newReviewImages.length
        if (currentImageCount + files.length > MAX_REVIEW_IMAGES) {
            toast.error(`You can upload up to ${MAX_REVIEW_IMAGES} review images.`)
            e.target.value = ''
            return
        }

        const nextImages = files.map((file) => ({
            file,
            name: file.name,
            preview: URL.createObjectURL(file),
        }))

        setNewReviewImages((prev) => [...prev, ...nextImages])
        e.target.value = ''
    }

    const removeRetainedReviewImage = (imageId) => {
        setReviewRetainedImages((prev) => prev.filter((image) => image.id !== imageId))
    }

    const removePendingReviewImage = (preview) => {
        setNewReviewImages((prev) => {
            const imageToRemove = prev.find((image) => image.preview === preview)
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.preview)
            }
            return prev.filter((image) => image.preview !== preview)
        })
    }

    const renderStars = (rating, extraClass = '') => (
        <div className={`rating-stars ${extraClass}`.trim()}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= Math.round(rating || 0) ? 'filled' : ''}>
                    &#9733;
                </span>
            ))}
        </div>
    )

    const renderInteractiveStars = (rating, onChange) => (
        <div className="review-rating-selector" role="radiogroup" aria-label="Select your review rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    className={`review-star-btn ${star <= rating ? 'active' : ''}`}
                    onClick={() => onChange(star)}
                >
                    &#9733;
                </button>
            ))}
            <span className="review-rating-label">{rating} out of 5</span>
        </div>
    )

    if (loading) return <div className="loading-state">Loading...</div>
    if (!product) return <div className="loading-state">Product not found</div>

    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0
    const averageRating = Number(product.rating_average || 0).toFixed(1)

    const getImageUrl = (img) => {
        if (!img) return 'https://via.placeholder.com/300'

        const imgStr = img.toString()
        if (imgStr.startsWith('http')) return imgStr

        const path = imgStr.startsWith('/') ? imgStr : `/${imgStr}`
        return `${BASE_URL}${path}`
    }

    const allImages = [
        { id: 'main', image: product.image },
        ...(product.extra_images || []),
    ]

    const handleNextImage = () => {
        const currentIndex = allImages.findIndex((img) => img.image === activeImg)
        const nextIndex = (currentIndex + 1) % allImages.length
        setActiveImg(allImages[nextIndex].image)
    }

    const handlePrevImage = () => {
        const currentIndex = allImages.findIndex((img) => img.image === activeImg)
        const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length
        setActiveImg(allImages[prevIndex].image)
    }

    const hasVariants = product.sizes && product.sizes.length > 0
    const availableSizes = hasVariants ? product.sizes.filter((size) => size.stock > 0) : []
    const reviews = product.reviews || []
    const canWriteReview = Boolean(product.can_review || product.user_review)

    return (
        <div className='main-details-wrapper'>
            <div className="breadcrumb-nav">
                <NavLink to={'/shop'} className="back-link">
                    <img src={backarrow} alt="Back" />
                    <span>Back to Shop</span>
                </NavLink>
            </div>

            <div className='details-grid'>
                <div className='image-section'>
                    <div className="main-image-container">
                        <img src={getImageUrl(activeImg)} alt={product.title} className="active-product-img" />
                        {discount > 0 && <span className="discount-tag">-{discount}%</span>}

                        {allImages.length > 1 && (
                            <>
                                <button className="gallery-nav-btn prev" onClick={handlePrevImage}>&lt;</button>
                                <button className="gallery-nav-btn next" onClick={handleNextImage}>&gt;</button>
                            </>
                        )}
                    </div>

                    {allImages.length > 1 && (
                        <div className="thumbnail-gallery">
                            {allImages.map((imgObj, index) => (
                                <div
                                    key={imgObj.id || index}
                                    className={`gallery-thumb ${activeImg === imgObj.image ? 'selected' : ''}`}
                                    onClick={() => setActiveImg(imgObj.image)}
                                >
                                    <img src={getImageUrl(imgObj.image)} alt={`thumbnail ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='info-section'>
                    <h2 className='brand-tag'>{product.brand}</h2>
                    <h1 className='product-title'>{product.title}</h1>

                    <div className="rating-overview">
                        {renderStars(product.rating_average, 'compact')}
                        <span className="rating-score">{averageRating}</span>
                        <span className="rating-count">
                            {product.rating_count || 0} review{product.rating_count === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div className='price-block'>
                        <span className='current-price'>Rs.{product.price}</span>
                        {product.mrp && <span className='original-price'>MRP Rs.{product.mrp}</span>}
                        <span className='tax-note'>Inc. of all taxes</span>
                    </div>

                    <div className="divider"></div>

                    {product.available_colors && product.available_colors.length > 0 && (
                        <div className="variants-section">
                            <h3 className="variants-header">Colors</h3>
                            <div className="variants-grid">
                                {product.available_colors.map((variant) => (
                                    <NavLink
                                        to={`/${variant.id}`}
                                        className="variant-card"
                                        key={variant.id}
                                        title={variant.color}
                                    >
                                        <img src={getImageUrl(variant.image)} alt={variant.color} />
                                        <span>{variant.color}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="size-section">
                        <div className="size-header">
                            <h3>Select Size</h3>
                        </div>
                        <div className="size-options">
                            {hasVariants ? (
                                availableSizes.length > 0 ? (
                                    availableSizes.map((sizeObj) => (
                                        <div key={sizeObj.id} className="size-wrapper">
                                            {sizeObj.stock < 10 && (
                                                <span className="stock-alert">{sizeObj.stock} left</span>
                                            )}
                                            <button
                                                className={`size-btn ${selectedSize === sizeObj.size ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(sizeObj.size)}
                                            >
                                                {sizeObj.size}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-stock-msg" style={{ color: '#d32f2f', fontWeight: 600, fontSize: '13px' }}>
                                        Out of Stock
                                    </p>
                                )
                            ) : (
                                <p className="no-size" style={{ color: '#666', fontSize: '13px' }}>One Size</p>
                            )}
                        </div>
                    </div>

                    <button
                        className='add-to-bag-btn'
                        onClick={handleAddToCart}
                        disabled={hasVariants && availableSizes.length === 0}
                    >
                        {hasVariants && availableSizes.length === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                    </button>

                    <div className="product-specs">
                        <h3>Product Details</h3>
                        <p className='description'>{product.description}</p>
                        <div className="spec-grid">
                            <div className="spec-item">
                                <span className="label">Category:</span>
                                <span className="value">{product.category || '-'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Fit:</span>
                                <span className="value">{product.fit || '-'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Style:</span>
                                <span className="value">{product.style || '-'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Code:</span>
                                <span className="value">{product.product_code || '-'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Color:</span>
                                <span className="value">{product.color || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="delivery-note">
                        <p><img className='deliveryicons' src={shipping} alt="" />Free Delivery on orders above Rs.999</p>
                        <p><img className='deliveryicons' src={tick} alt="" />7 Day Easy Return Policy</p>
                    </div>
                </div>
            </div>

            <section className="reviews-section">
                <div className="reviews-section-header">
                    <div>
                        <h2>Customer Reviews</h2>
                        <p>Verified buyers can rate and review after delivery.</p>
                    </div>
                </div>

                <div className="reviews-summary-card">
                    <div className="summary-score">{averageRating}</div>
                    <div className="summary-copy">
                        {renderStars(product.rating_average)}
                        <p>
                            Based on {product.rating_count || 0} review{product.rating_count === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                <div className="reviews-layout">
                    <div className="review-form-card">
                        <h3>{product.user_review ? 'Update Your Review' : 'Write a Review'}</h3>

                        {!token && (
                            <div className="review-helper">
                                <p>Login to add your rating and feedback for this product.</p>
                                <button className="review-submit-btn" onClick={() => navigate('/login')}>
                                    LOGIN TO REVIEW
                                </button>
                            </div>
                        )}

                        {token && !canWriteReview && (
                            <div className="review-helper">
                                <p>Reviews unlock after at least one order of this item is marked delivered.</p>
                            </div>
                        )}

                        {token && canWriteReview && (
                            <form className="review-form" onSubmit={handleReviewSubmit}>
                                {renderInteractiveStars(
                                    reviewForm.rating,
                                    (rating) => setReviewForm((prev) => ({ ...prev, rating }))
                                )}

                                <input
                                    type="text"
                                    className="review-text-input"
                                    placeholder="Review title"
                                    value={reviewForm.title}
                                    onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                                />

                                <textarea
                                    className="review-textarea"
                                    placeholder="Share what you liked, the fit, print quality, or anything helpful."
                                    rows="5"
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                                />

                                <div className="review-images-field">
                                    <div className="review-images-copy">
                                        <strong>Add Photos</strong>
                                        <span>Up to {MAX_REVIEW_IMAGES} images</span>
                                    </div>

                                    <label className="review-image-picker">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleReviewImageChange}
                                        />
                                        Upload review images
                                    </label>

                                    {(reviewRetainedImages.length > 0 || newReviewImages.length > 0) && (
                                        <div className="review-image-preview-grid">
                                            {reviewRetainedImages.map((image) => (
                                                <div key={image.id} className="review-image-preview">
                                                    <img src={getImageUrl(image.image)} alt="Review upload" />
                                                    <button
                                                        type="button"
                                                        className="review-image-remove-btn"
                                                        onClick={() => removeRetainedReviewImage(image.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}

                                            {newReviewImages.map((image) => (
                                                <div key={image.preview} className="review-image-preview">
                                                    <img src={image.preview} alt={image.name} />
                                                    <button
                                                        type="button"
                                                        className="review-image-remove-btn"
                                                        onClick={() => removePendingReviewImage(image.preview)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button className="review-submit-btn" type="submit" disabled={submittingReview}>
                                    {submittingReview ? 'SAVING...' : product.user_review ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="reviews-list-card">
                        <h3>What people are saying</h3>

                        {reviews.length > 0 ? (
                            <div className="reviews-grid">
                                {reviews.map((review) => (
                                    <article key={review.id} className="review-card">
                                        <div className="review-card-top">
                                            <div>
                                                <h6>{review.user_name}</h6>
                                                {renderStars(review.rating, 'compact')}
                                            </div>
                                            <span>{review.created_at}</span>
                                        </div>
                                        {review.title && <strong>{review.title}</strong>}
                                        <p>{review.comment || 'No written comment added.'}</p>
                                        {review.images?.length > 0 && (
                                            <div className="review-card-image-grid">
                                                {review.images.map((image) => (
                                                    <img
                                                        key={image.id}
                                                        src={getImageUrl(image.image)}
                                                        alt={`${review.user_name} review`}
                                                        className="review-card-image"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="review-empty-state">
                                No reviews yet. The first delivered customer can start the conversation.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Detailsproducts
