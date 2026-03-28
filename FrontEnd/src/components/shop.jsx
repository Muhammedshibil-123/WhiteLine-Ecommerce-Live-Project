import { NavLink } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import './shop.css'
import { FaHeart } from "react-icons/fa";
import { FiFilter, FiChevronDown, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { CartContext } from "../component/cartcouter";
import { WishlistContext } from "../component/whislistcouter";
import { SearchContext } from "../component/searchcontext";
import ReactPaginate from "react-paginate";
import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_FIT_OPTIONS,
  PRODUCT_PRICE_FILTER_OPTIONS,
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_STYLE_OPTIONS,
} from "../constants/productOptions";


const getApiUrl = () => {
  try {
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  } catch (e) {
    return 'http://127.0.0.1:8000/api';
  }
};



function Shop() {
  const [products, setProducts] = useState([]);
  const API_URL = getApiUrl();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortType, setSortType] = useState('default')
  const [categorySort, setCategorySort] = useState('all')
  const [fitSort, setFitSort] = useState('all')
  const [colorSort, setColorSort] = useState('all')
  const [sizeSort, setSizeSort] = useState('all')
  const [styleSort, setStyleSort] = useState('all')

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');

  const BASE_URL = API_URL.replace('/api', '');

  const { searchTerm } = useContext(SearchContext)
  const { CartHandleChange } = useContext(CartContext)



  const { WishlistHandleChange, wishlist } = useContext(WishlistContext)

  const [currentPage, setCurrentPage] = useState(0)
  const productsPerPage = 12

  useEffect(() => {
    let url = `${API_URL}/products/`;
    const params = new URLSearchParams();
    if (appliedMinPrice) params.append("min_price", appliedMinPrice);
    if (appliedMaxPrice) params.append("max_price", appliedMaxPrice);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    axios
      .get(url)
      .then((res) => {
        let filterdata = res.data.filter((product) => {
          return product.status === 'active'
        })
        setProducts(filterdata)
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, [API_URL, appliedMinPrice, appliedMaxPrice]);


  let filterProducts = products.filter((product) =>
    (product.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.category?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.fit?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.style?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.color?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  if (categorySort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.category && product.category.toLowerCase() === categorySort.toLowerCase()
    )
  }

  if (fitSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.fit && product.fit.toLowerCase() === fitSort.toLowerCase()
    )
  }

  if (colorSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.color && product.color.toLowerCase() === colorSort.toLowerCase()
    )
  }

  if (sizeSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.sizes?.some((size) => size.size === sizeSort && Number(size.stock) > 0)
    )
  }


  if (styleSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.style && product.style.toLowerCase() === styleSort.toLowerCase()
    )
  }

  if (sortType === 'low to high') {
    filterProducts.sort((a, b) => a.price - b.price)
  } else if (sortType === 'high to low') {
    filterProducts.sort((a, b) => b.price - a.price)
  }

  const colorOptions = Array.from(
    new Set(products.map((product) => product.color).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, sortType, categorySort, fitSort, colorSort, sizeSort, appliedMinPrice, appliedMaxPrice, styleSort])


  function whishlistcolor(productId) {
    return wishlist.some((item) => item.id === productId);
  }

  const offset = currentPage * productsPerPage;
  const pageCount = Math.ceil(filterProducts.length / productsPerPage);
  const currentProducts = filterProducts.slice(offset, offset + productsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const renderRatingSummary = (product) => {
    const ratingCount = Number(product.rating_count || 0);
    const ratingAverage = Number(product.rating_average || 0).toFixed(1);

    return (
      <div className="product-rating-row">
        <div className="product-rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= Math.round(product.rating_average || 0) ? 'filled' : ''}>
              &#9733;
            </span>
          ))}
        </div>
        <span className="product-rating-copy">
          {ratingCount > 0 ? `${ratingAverage} (${ratingCount})` : 'No reviews yet'}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="shop-header-wrapper">
        <div className="shop-header">
          <h2>Shop Collection</h2>
          <motion.button 
            className="toggle-filters-btn"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFiltersOpen ? <><FiX /> Close Filters</> : <><FiFilter /> Filter & Sort</>}
          </motion.button>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                className="filter-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFiltersOpen(false)}
              />

              {/* Right-Side Drawer */}
              <motion.div 
                className="filter-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="drawer-header">
                  <h3><FiFilter /> Filter & Sort</h3>
                  <button className="close-drawer-btn" onClick={() => setIsFiltersOpen(false)}>
                    <FiX />
                  </button>
                </div>

                <div className="filters-container">
                  <div className="filter-group">
                    <label>Sort By</label>
                    <div className="select-wrapper">
                      <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
                        <option value="default">Featured</option>
                        <option value="low to high">Price: Low to High</option>
                        <option value="high to low">Price: High to Low</option>
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Category</label>
                    <div className="select-wrapper">
                      <select value={categorySort} onChange={(e) => setCategorySort(e.target.value)}>
                        <option value="all">All Categories</option>
                        {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Fit</label>
                    <div className="select-wrapper">
                      <select value={fitSort} onChange={(e) => setFitSort(e.target.value)}>
                        <option value="all">All Fits</option>
                        {PRODUCT_FIT_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Color</label>
                    <div className="select-wrapper">
                      <select value={colorSort} onChange={(e) => setColorSort(e.target.value)}>
                        <option value="all">All Colors</option>
                        {colorOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Size</label>
                    <div className="select-wrapper">
                      <select value={sizeSort} onChange={(e) => setSizeSort(e.target.value)}>
                        <option value="all">All Sizes</option>
                        {PRODUCT_SIZE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Price Range</label>
                    <div className="price-inputs">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        value={minPrice} 
                        onChange={(e) => setMinPrice(e.target.value)} 
                        className="price-input"
                      />
                      <span style={{color: '#999'}}>-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="price-input"
                      />
                      <button 
                        className="apply-price-btn" 
                        onClick={() => {
                          setAppliedMinPrice(minPrice);
                          setAppliedMaxPrice(maxPrice);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Style</label>
                    <div className="select-wrapper">
                      <select value={styleSort} onChange={(e) => setStyleSort(e.target.value)}>
                        <option value="all">All Styles</option>
                        {PRODUCT_STYLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="main-shop-container">
        {currentProducts.map((product, index) => {

          const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

          // const imageUrl = product.image
          //   ? (product.image.toString().startsWith('http')
          //     ? product.image
          //     : `http://127.0.0.1:8000${product.image}`)
          //   : 'https://via.placeholder.com/300?text=No+Image';
          const imageUrl = product.image
            ? (product.image.toString().startsWith('http')
              ? product.image
              : `${BASE_URL}${product.image}`)
            : 'https://via.placeholder.com/300?text=No+Image';

          return (
            <div className="shop-container" key={index}>

              <div className="whislist-contaniner"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  WishlistHandleChange(product);
                }}>
                <FaHeart style={{
                  color: whishlistcolor(product.id) ? '#e63946' : '#ccc',
                  width: '18px',
                  height: '18px'
                }} />
              </div>

              <NavLink to={`/${product.id}`} style={{ textDecoration: 'none' }}>
                <div className="product-image-box">
                  <img
                    src={imageUrl}
                    alt={product.title}
                  />

                  {discount > 0 && (
                    <span className="discount-badge">{discount}% OFF</span>
                  )}
                </div>
                <div className="product-info-box">
                  <h3>{product.title}</h3>
                  <h4>{product.brand}</h4>
                  {renderRatingSummary(product)}

                  <div className="price-row">
                    <span className="selling-price">₹{product.price}</span>
                    {product.mrp && <span className="mrp-price">₹{product.mrp}</span>}
                  </div>
                </div>
              </NavLink>

              <div className="button-wrapper">
                <button className="addtocart" onClick={() => CartHandleChange(product)}>ADD TO BAG</button>
              </div>
            </div>
          )
        })}
      </div>

      <ReactPaginate
        previousLabel={"Prev"}
        nextLabel={'Next'}
        pageCount={pageCount}
        onPageChange={handlePageClick}
        containerClassName={'pagination'}
        activeClassName={'active'}
        pageClassName={'page-item'}
        pageLinkClassName={'page-link'}
        previousClassName={'page-item'}
        previousLinkClassName={'page-link'}
        nextClassName={'page-item'}
        nextLinkClassName={'page-link'}
        breakClassName={'page-item'}
        breakLinkClassName={'page-link'}
      />
    </>
  );
}

export default Shop;
