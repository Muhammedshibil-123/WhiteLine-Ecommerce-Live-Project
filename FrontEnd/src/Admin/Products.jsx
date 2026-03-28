import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './products.css'
import closing from '../assets/closing.png'

function Products() {
  const [products, setProducts] = useState([])
  const [popAdd, setpopAdd] = useState(false)
  const [popEdit, setpopEdit] = useState(false)
  const [popStock, setPopStock] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const [stockForm, setStockForm] = useState({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 })

  const [search, setSearch] = useState('')
  const [catSort, setCatSort] = useState('all') 
  
  const [newProduct, setNewProducts] = useState({
    title: '', product_code: '', color: '', brand: '',
    sleeve_type: '', theme: '', description: '',
    price: '', mrp: '', status: 'active'
  })
  
  const [imageFile, setImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])

  const getApiUrl = () => {
    try {
      return import.meta.env.VITE_API_URL || 'http://localhost:8000';
    } catch (e) {
      return 'http://localhost:8000';
    }
  };
  const API_URL = getApiUrl();

  useEffect(() => {
    axios.get(`${API_URL}/products/`)
      .then((res) => {
        setProducts(res.data)
      })
      .catch((err) => console.log(err))
  }, [API_URL])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProducts(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0])
  }

  const handleGalleryChange = (index, file) => {
    const updated = [...galleryFiles]
    updated[index] = file
    setGalleryFiles(updated)
  }

  const addGalleryField = () => {
    setGalleryFiles([...galleryFiles, null])
  }

  const removeGalleryField = (index) => {
    const updated = galleryFiles.filter((_, i) => i !== index)
    setGalleryFiles(updated)
  }

  const handleStockClick = (product) => {
    setCurrentProduct(product)
    const initialStock = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(sizeObj => {
            if (initialStock.hasOwnProperty(sizeObj.size)) {
                initialStock[sizeObj.size] = sizeObj.stock
            }
        })
    }
    setStockForm(initialStock)
    setPopStock(true)
  }

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const saveStock = (e) => {
    e.preventDefault()
    const stockData = Object.keys(stockForm).map(key => ({
        size: key,
        stock: stockForm[key]
    }))

    axios.post(`${API_URL}/products/${currentProduct.id}/stock/`, stockData)
      .then((res) => {
        setProducts(prev => prev.map(p => p.id === currentProduct.id ? res.data : p))
        setPopStock(false)
        setCurrentProduct(null)
      })
      .catch(err => {
        console.error(err)
        alert("Failed to update stock")
      })
  }

  function submit(e) {
    e.preventDefault()
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => {
        if(newProduct[key]) formData.append(key, newProduct[key]);
    });
    if (imageFile) formData.append('image', imageFile);
    
    galleryFiles.forEach((file) => {
        if (file) formData.append('gallery', file);
    });

    axios.post(`${API_URL}/products/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        setProducts((prev) => [...prev, res.data])
        setpopAdd(false)
        setNewProducts({
          title: '', product_code: '', color: '', brand: '', 
          sleeve_type: '', theme: '', description: '', 
          price: '', mrp: '', status: 'active'
        })
        setImageFile(null)
        setGalleryFiles([])
      })
      .catch((err) => alert("Error adding product."))
  }

  function toggleProductStatus(id) {
    const product = products.find((p) => p.id === id)
    if (!product) return
    const newStatus = product.status === "active" ? "inactive" : "active"

    axios.patch(`${API_URL}/products/${id}/`, { status: newStatus })
      .then(res => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)))
      })
      .catch((err) => console.error(err))
  }

  function handleEditClick(product) {
    setCurrentProduct(product)
    setpopEdit(true)
    setImageFile(null)
    setGalleryFiles([])
  }

  const handleInputChangeEdit = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }))
  }

  function handleUpdate(e) {
    e.preventDefault()
    if (!currentProduct) return;
    const formData = new FormData();
    formData.append('title', currentProduct.title);
    formData.append('product_code', currentProduct.product_code);
    formData.append('color', currentProduct.color);
    formData.append('brand', currentProduct.brand);
    formData.append('sleeve_type', currentProduct.sleeve_type);
    formData.append('theme', currentProduct.theme);
    formData.append('description', currentProduct.description);
    formData.append('price', currentProduct.price);
    if(currentProduct.mrp) formData.append('mrp', currentProduct.mrp);
    if (imageFile) formData.append('image', imageFile);

    galleryFiles.forEach((file) => {
        if (file) formData.append('gallery', file);
    });

    axios.patch(`${API_URL}/products/${currentProduct.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        setProducts((prev) => prev.map((p) => p.id === currentProduct.id ? res.data : p))
        setpopEdit(false)
        setCurrentProduct(null)
        setImageFile(null)
        setGalleryFiles([])
      })
      .catch((err) => console.error(err))
  }

  function removeproduct(id) {
    if(window.confirm("Are you sure you want to delete this product?")) {
        axios.delete(`${API_URL}/products/${id}/`)
        .then(() => setProducts(prev => prev.filter((p) => p.id !== id)))
        .catch((err) => console.error(err))
    }
  }

  let filterProducts = products.filter((product) => (
    (product.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (product.brand?.toLowerCase() || '').includes(search.toLowerCase())
  ))

  if (catSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.sleeve_type && product.sleeve_type.toLowerCase() === catSort.toLowerCase()
    )
  }

  const renderStockGrid = (sizes) => {
    const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    
    return (
        <div className="stock-display-grid">
            {allSizes.map(sizeLabel => {
                const sizeObj = sizes ? sizes.find(s => s.size === sizeLabel) : null;
                const stockVal = sizeObj ? sizeObj.stock : 0;
                
                return (
                   <div key={sizeLabel} className={`stock-item ${stockVal === 0 ? 'zero' : ''}`}>
                       {sizeLabel}-{stockVal}
                   </div>
                )
            })}
        </div>
    )
  }

  return (
    <div className='products-page-wrapper'>
      <div className='main-products-container'>
        <div className="products-header">
          <h1>INVENTORY</h1>
          <div className="controls-container">
            <div className="search-box">
              <input type="text" onChange={(e) => setSearch(e.target.value)} placeholder='Search products...' value={search}/>
            </div>
            <div className="filter-box">
              <select value={catSort} onChange={(e) => setCatSort(e.target.value)}>
                <option value="all">All Types</option>
                <option value="oversized">Oversized</option>
                <option value="half sleeve">Half Sleeve</option>
                <option value="full sleeve">Full Sleeve</option>
                <option value="sleeveless">Sleeveless</option>
              </select>
            </div>
            <button className="add-btn" onClick={() => setpopAdd(true)}>+ NEW DROP</button>
          </div>
        </div>

        <div className="table-header-row">
          <span className='col-id'>ID</span>
          <span className='col-img'>IMAGE</span>
          <span className='col-title'>PRODUCT DETAILS</span>
          <span className='col-price'>PRICE</span>
          <span style={{paddingLeft:'30px'}} className='col-stock'>STOCK</span>
          <span className='col-status'>STATUS</span>
          <span style={{paddingLeft:'50px'}} className='col-action'>ACTION</span>
        </div>

        <div className="products-list">
          {filterProducts.map((product) => (
            <div className="product-row" key={product.id}>
              <span className='col-id'>#{product.id}</span>
              <span className='col-img'>
                {product.image ? <img src={product.image} alt={product.title} /> : <div className="no-image">No Img</div>}
              </span>
              <span className='col-title'>
                <strong>{product.title}</strong>
                <p>{product.brand} | {product.color}</p>
              </span>
              
              <span className='col-price'>₹{product.price}</span>

              <span className='col-stock'>
                 {renderStockGrid(product.sizes)}
              </span>

              <span className='col-status'>
                <button onClick={() => toggleProductStatus(product.id)} className={`toggle-btn ${product.status === "active" ? "on" : "off"}`}>
                  <div className="toggle-circle"></div>
                </button>
              </span>

              <span className='col-action'>
                <button className="action-btn stock" onClick={() => handleStockClick(product)}>STOCK</button>
                <button className="action-btn edit" onClick={() => handleEditClick(product)}>EDIT</button>
                <button className="action-btn delete" onClick={() => removeproduct(product.id)}>DEL</button>
              </span>
            </div>
          ))}
        </div>

       
        {popAdd && (
            <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>ADD NEW DROP</h2>
                <img src={closing} onClick={() => setpopAdd(false)} alt="Close" />
              </div>
              <form onSubmit={submit} className="modal-form">
                <div className="form-grid">
                    <div className="input-group"><label>Title</label><input type="text" name='title' value={newProduct.title} onChange={handleInputChange} required /></div>
                    <div className="input-group"><label>Brand</label><input type="text" name='brand' value={newProduct.brand} onChange={handleInputChange} required /></div>
                    <div className="input-group"><label>Product Code</label><input type="text" name='product_code' value={newProduct.product_code} onChange={handleInputChange} required /></div>
                    <div className="input-group"><label>Color</label><input type="text" name='color' value={newProduct.color} onChange={handleInputChange} required /></div>
                    <div className="input-group"><label>Sleeve Type</label><select name='sleeve_type' value={newProduct.sleeve_type} onChange={handleInputChange} required><option value="">Select</option><option value="Half Sleeve">Half Sleeve</option><option value="Full Sleeve">Full Sleeve</option><option value="Sleeveless">Sleeveless</option><option value="Oversized">Oversized</option></select></div>
                    <div className="input-group"><label>Theme</label><select name='theme' value={newProduct.theme} onChange={handleInputChange} required><option value="">Select</option><option value="Anime">Anime</option><option value="Sports">Sports</option><option value="Movie">Movie</option><option value="Motivational">Motivational</option><option value="Minimal">Minimal</option><option value="Vintage">Vintage</option></select></div>
                    <div className="input-group"><label>Price</label><input type="number" name='price' value={newProduct.price} onChange={handleInputChange} required /></div>
                    <div className="input-group"><label>MRP</label><input type="number" name='mrp' value={newProduct.mrp} onChange={handleInputChange} /></div>
                    <div className="input-group full-width"><label>Main Image</label><input type="file" accept="image/*" onChange={handleImageChange} required /></div>
                    <div className="input-group full-width">
                        <label>Product Gallery</label>
                        {galleryFiles.map((_, index) => (
                            <div key={index} className="gallery-input-row">
                                <input type="file" accept="image/*" onChange={(e) => handleGalleryChange(index, e.target.files[0])} />
                                <button type="button" className="remove-gallery-btn" onClick={() => removeGalleryField(index)}>Remove</button>
                            </div>
                        ))}
                        <button type="button" className="add-gallery-btn" onClick={addGalleryField}>+ Add Gallery Image</button>
                    </div>
                    <div className="input-group full-width"><label>Description</label><textarea name='description' rows="3" value={newProduct.description} onChange={handleInputChange} /></div>
                </div>
                <button type="submit" className="save-btn">PUBLISH</button>
              </form>
            </div>
          </div>
        )}

        {popEdit && currentProduct && (
             <div className="modal-overlay">
             <div className="modal-content">
               <div className="modal-header">
                 <h2>EDIT PRODUCT</h2>
                 <img src={closing} onClick={() => setpopEdit(false)} alt="Close" />
               </div>
               <form onSubmit={handleUpdate} className="modal-form">
                 <div className="form-grid">
                     <div className="input-group"><label>Title</label><input type="text" name='title' value={currentProduct.title} onChange={handleInputChangeEdit} required /></div>
                     <div className="input-group"><label>Brand</label><input type="text" name='brand' value={currentProduct.brand} onChange={handleInputChangeEdit} required /></div>
                     <div className="input-group"><label>Product Code</label><input type="text" name='product_code' value={currentProduct.product_code} onChange={handleInputChangeEdit} required /></div>
                     <div className="input-group"><label>Color</label><input type="text" name='color' value={currentProduct.color} onChange={handleInputChangeEdit} required /></div>
                     <div className="input-group"><label>Sleeve Type</label><select name='sleeve_type' value={currentProduct.sleeve_type} onChange={handleInputChangeEdit} required><option value="Half Sleeve">Half Sleeve</option><option value="Full Sleeve">Full Sleeve</option><option value="Sleeveless">Sleeveless</option><option value="Oversized">Oversized</option></select></div>
                     <div className="input-group"><label>Theme</label><select name='theme' value={currentProduct.theme} onChange={handleInputChangeEdit} required><option value="Anime">Anime</option><option value="Sports">Sports</option><option value="Movie">Movie</option><option value="Motivational">Motivational</option><option value="Minimal">Minimal</option><option value="Vintage">Vintage</option></select></div>
                     <div className="input-group"><label>Price</label><input type="number" name='price' value={currentProduct.price} onChange={handleInputChangeEdit} required /></div>
                     <div className="input-group"><label>MRP</label><input type="number" name='mrp' value={currentProduct.mrp} onChange={handleInputChangeEdit} /></div>
                     <div className="input-group full-width"><label>Update Main Image</label><input type="file" accept="image/*" onChange={handleImageChange} /></div>
                     <div className="input-group full-width">
                        <label>Add New Gallery Images</label>
                        {galleryFiles.map((_, index) => (
                            <div key={index} className="gallery-input-row">
                                <input type="file" accept="image/*" onChange={(e) => handleGalleryChange(index, e.target.files[0])} />
                                <button type="button" className="remove-gallery-btn" onClick={() => removeGalleryField(index)}>Remove</button>
                            </div>
                        ))}
                        <button type="button" className="add-gallery-btn" onClick={addGalleryField}>+ Add Gallery Image</button>
                    </div>
                     <div className="input-group full-width"><label>Description</label><textarea name='description' rows="3" value={currentProduct.description} onChange={handleInputChangeEdit} /></div>
                 </div>
                 <button type="submit" className="save-btn">UPDATE</button>
               </form>
             </div>
           </div>
        )}

        {popStock && currentProduct && (
          <div className="modal-overlay">
            <div className="modal-content small-modal">
              <div className="modal-header">
                <h2>MANAGE STOCK</h2>
                <img src={closing} onClick={() => setPopStock(false)} alt="Close" />
              </div>
              <div className="stock-info-header">
                  <h3>{currentProduct.title}</h3>
                  <p>Product Code: {currentProduct.product_code}</p>
              </div>
              <form onSubmit={saveStock} className="modal-form">
                <div className="stock-grid">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <div className="input-group" key={size}>
                            <label>Size {size}</label>
                            <input type="number" min="0" name={size} value={stockForm[size]} onChange={handleStockChange} />
                        </div>
                    ))}
                </div>
                <button type="submit" className="save-btn">UPDATE STOCK</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Products