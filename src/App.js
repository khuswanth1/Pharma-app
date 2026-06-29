import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
 
import "./App.css";
 
import Header from "./components/Header/Header";
import CategorySlider from "./components/Header/CategorySlider";
import BackButton from "./components/Header/BackButton";
import PageLoader from "./components/Layout/PageLoader";
import { AuthContext } from "./context/AuthContext";
 
// Pages
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout/Checkout";
import OrderTracking from "./pages/Orders/OrderTracking";
import DeliveryMap from "./pages/Orders/DeliveryMap";
import Profile from "./pages/Profile/Profile";
import AddressManager from "./pages/Profile/AddressManager";
import SearchResults from "./pages/SearchResults/SearchResults";
import WishlistPage from "./pages/WishlistPage";
import PaymentFailed from "./pages/Checkout/PaymentFailed";
import LabTestBooking from "./pages/Medical/LabTestBooking";


// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};
 
// ================== LAYOUT CONTROLLER ==================
const LayoutController = ({ children }) => {
  const location = useLocation();

  const isAuthRoute = location.pathname === "/" || location.pathname === "/login";

  const isMinimalLayout =
    isAuthRoute ||
    location.pathname.startsWith("/ProductDetail") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/payment") ||
    location.pathname.startsWith("/wishlist") ||
    location.pathname.startsWith("/order-tracking") ||
    location.pathname.startsWith("/book-test") ||
    location.pathname.startsWith("/delivery-map");

  return (
    <div className="flex flex-col h-screen">

      {/* Header */}
      {!isAuthRoute && <Header />}

      <div className="flex flex-1 overflow-hidden relative">

        {/* Hide Sidebar on minimal pages */}
        {!isMinimalLayout && <CategorySlider />}

        <div className="flex-1 overflow-auto relative">

          {/* Show BackButton on minimal pages (except auth screens, product details, profile page, cart page, checkout page, and order-tracking page) */}
          {isMinimalLayout &&
            !isAuthRoute &&
            !location.pathname.startsWith("/ProductDetail") &&
            !location.pathname.startsWith("/profile") &&
            !location.pathname.startsWith("/cart") &&
            !location.pathname.startsWith("/checkout") &&
            !location.pathname.startsWith("/payment-failed") &&
            !location.pathname.startsWith("/wishlist") &&
            !location.pathname.startsWith("/order-tracking") &&
            !location.pathname.startsWith("/book-test") && (
              <div className="absolute top-4 left-4 z-50">
                <BackButton />
              </div>
            )}

          <PageLoader />
          {children}
        </div>

      </div>
    </div>
  );
};

// ================= MAIN APP ===================
const App = () => {
  return (
<Router>
<LayoutController>
<Routes>
          {/* Landing / Login */}
<Route path="/" element={<Navigate to="/login" replace />} />
<Route path="/home/*" element={<Home />} />

 
          {/* Product Detail */}
<Route path="/ProductDetail/*" element={<ProductDetail />} />
 
          {/* Cart */}
<Route path="/cart" element={<CartPage />} />
 
          {/* Wishlist */}
          <Route path="/wishlist" element={<WishlistPage />} />

          {/* Lab Test Booking */}
          <Route
            path="/book-test"
            element={
              <ProtectedRoute>
                <LabTestBooking />
              </ProtectedRoute>
            }
          />

 
          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-failed"
            element={
              <ProtectedRoute>
                <PaymentFailed />
              </ProtectedRoute>
            }
          />
 
          {/* Orders */}
<Route
            path="/order-tracking/:id"
            element={
<ProtectedRoute>
<OrderTracking />
</ProtectedRoute>
            }
          />
<Route
            path="/delivery-map/:id"
            element={
<ProtectedRoute>
<DeliveryMap />
</ProtectedRoute>
            }
          />
 
          {/* Profile */}
{/* <Route
            path="/profile"
            element={
<ProtectedRoute>
<Profile />
</ProtectedRoute>
            }
          /> */}
            <Route path="/profile/*" element={<Profile />} />
 <Route path="/searchresults" element={<SearchResults />} />

          {/* Address */}
<Route
            path="/addresses"
            element={
<ProtectedRoute>
<AddressManager />
</ProtectedRoute>
            }
          />
 
          {/* Auth */}
<Route path="/login/*" element={<Login />} />
 
          {/* Fallback */}
<Route path="*" element={<Navigate to="/home" />} />
</Routes>
</LayoutController>
</Router>
  );
};
 
export default App;