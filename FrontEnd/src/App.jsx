import './App.css'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './components/login'
import Signup from './components/signup'
import Home from './components/Home'
import Shop from './components/shop'
import Navbar from './components/navbar'
import Cart from './components/cart'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from './components/profile'
import Checkout from './components/checkout'
import Susscess from './components/susscess'
import Detailsproducts from './components/detailsproducts'
import { useLocation } from 'react-router-dom'
import Notfound from './components/notfound'
import Whislist from './components/whislist'
import Myorders from './components/myorders'
import About from './components/about'
import { CartProvider } from './component/cartcouter'
import { WhishlistProvider } from './component/whislistcouter'
import Dashbaord from './Admin/dashboard'
import Adminprotected from './Admin/adminprotected'
import Users from './Admin/users'
import Sidebar from './Admin/sidebar'
import Orders from './Admin/orders'
import Products from './Admin/Products'
import Reviews from './Admin/reviews'
import { SearchProvider } from './component/searchcontext'
import OtpVerify from './components/otpverfiy';
import { AuthProvider } from './component/AuthContext';
import ForgotPassword from './components/forgotpassword';
import ResetPassword from './components/resetpassword';
import AddressManagement from './components/AddressManagement';


function App() {


  const ConditonNavbar = () => {
    const location = useLocation()
    if (location.pathname === '/login' || location.pathname === '/signup' || 
        location.pathname === '/forgot-password' || 
        location.pathname === '/reset-password' || location.pathname.startsWith('/admin') || location.pathname === '/otp-verify') {
      return null
    } else {
      return <Navbar />
    }
  }

  return (
    <>
      <SearchProvider>
        <AuthProvider>
          <WhishlistProvider>
            <CartProvider>

              <BrowserRouter>
                <ConditonNavbar />
                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark" 
                  style={{ top: '90px' }}
                />
                <Routes>

                  <Route path='/' element={<Home />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/signup' element={<Signup />} />
                  <Route path='/forgot-password' element={<ForgotPassword />} />
                  <Route path='/reset-password' element={<ResetPassword />} />
                  <Route path='/otp-verify' element={<OtpVerify />} />
                  <Route path='/shop' element={<Shop />} />
                  <Route path='/cart' element={<Cart />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path='/checkout' element={<Checkout />} />
                  <Route path='/success' element={<Susscess />} />
                  <Route path='/:id' element={<Detailsproducts />} />
                  <Route path='/whishlist' element={<Whislist />} />
                  <Route path='/myorders' element={<Myorders />} />
                  <Route path='/about' element={<About />} />
                  <Route path="/addresses" element={<AddressManagement />} />


                  <Route path='/admin' element={<Adminprotected />}>
                    <Route element={<Sidebar />}>
                      <Route index element={<Dashbaord />} />
                      <Route path='users' element={<Users />} />
                      <Route path='products' element={<Products />} />
                      <Route path='orders' element={<Orders />} />
                      <Route path='reviews' element={<Reviews />} />

                    </Route>
                  </Route>



                  <Route path='*' element={<Notfound />} />
                </Routes>
              </BrowserRouter>

            </CartProvider>
          </WhishlistProvider>
        </AuthProvider>
      </SearchProvider>
    </>
  )
}

export default App
