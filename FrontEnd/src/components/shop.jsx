import { NavLink } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import './shop.css'
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { CartContext } from "../component/cartcouter";
import { WishlistContext } from "../component/whislistcouter";
import { SearchContext } from "../component/searchcontext";
import ReactPaginate from "react-paginate";


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

  const [sortType, setSortType] = useState('default')
  const [themeSort, setThemeSort] = useState('all')
  const [sleeveSort, setSleeveSort] = useState('all')

  const BASE_URL = API_URL.replace('/api', '');

  const navigate = useNavigate()

  const { searchTerm } = useContext(SearchContext)
  const { CartHandleChange } = useContext(CartContext)


  const { WishlistHandleChange, wishlist } = useContext(WishlistContext)

  const [currentPage, setCurrentPage] = useState(0)
  const productsPerPage = 12

  useEffect(() => {
    axios
      .get(`${API_URL}/products/`)
      .then((res) => {
        console.log("Products Fetched:", res.data);
        let filterdata = res.data.filter((product) => {
          return product.status === 'active'
        })
        setProducts(filterdata)
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, [API_URL]);


  let filterProducts = products.filter((product) =>
    (product.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.theme?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )


  if (sortType === 'low to high') {
    filterProducts.sort((a, b) => a.price - b.price)
  } else if (sortType === 'high to low') {
    filterProducts.sort((a, b) => b.price - a.price)
  }


  if (themeSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.theme && product.theme.toLowerCase() === themeSort.toLowerCase()
    )
  }

  if (sleeveSort !== 'all') {
    filterProducts = filterProducts.filter((product) =>
      product.sleeve_type && product.sleeve_type.toLowerCase() === sleeveSort.toLowerCase()
    )
  }


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
      <div className="filters-container">

        <div className="filter-group">
          <label>Sort By</label>
          <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
            <option value="default">Featured</option>
            <option value="low to high">Price: Low to High</option>
            <option value="high to low">Price: High to Low</option>
          </select>
        </div>


        <div className="filter-group">
          <label>Theme</label>
          <select value={themeSort} onChange={(e) => setThemeSort(e.target.value)}>
            <option value="all">All Themes</option>
            <option value="Anime">Anime</option>
            <option value="Sports">Sports</option>
            <option value="Movie">Movie</option>
            <option value="Motivational">Motivational</option>
            <option value="Minimal">Minimal</option>
            <option value="Vintage">Vintage</option>
          </select>
        </div>


        <div className="filter-group">
          <label>Sleeve Type</label>
          <select value={sleeveSort} onChange={(e) => setSleeveSort(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Half Sleeve">Half Sleeve</option>
            <option value="Full Sleeve">Full Sleeve</option>
            <option value="Sleeveless">Sleeveless</option>
            <option value="Oversized">Oversized</option>
          </select>
        </div>
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
