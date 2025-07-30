import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import FloatingCart from './components/FloatingCart';
import ScrollToTop from './components/ScrollToTop';

// Public Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Brands from './pages/Brands';
import Contact from './pages/Contact';
import AuthCallback from './pages/AuthCallback';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import Import from './pages/admin/Import';

function App() {
  // Force scroll to top when app first loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Listen for user role changes and handle dashboard access dynamically
  useEffect(() => {
    const handleUserRoleChange = (e) => {
      const user = e.detail;
      console.log('App: User role changed:', user);
      
      // If user lost admin privileges while on admin route, redirect to home
      if (user && !['admin', 'main_admin', 'sub_admin'].includes(user.role)) {
        const currentPath = window.location.hash;
        if (currentPath.includes('/admin')) {
          console.log('User lost admin privileges, redirecting to home');
          window.location.hash = '/';
        }
      }
    };

    // Listen for role update events that affect navigation
    const handleUserRoleUpdate = (e) => {
      const { userId, newRole } = e.detail;
      console.log('App: User role updated:', { userId, newRole });
      // This will be handled by AuthContext and ProtectedRoute
      // Just log for debugging purposes
    };

    window.addEventListener('userRoleChanged', handleUserRoleChange);
    window.addEventListener('userRoleUpdated', handleUserRoleUpdate);

    return () => {
      window.removeEventListener('userRoleChanged', handleUserRoleChange);
      window.removeEventListener('userRoleUpdated', handleUserRoleUpdate);
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Auth Callback Routes - Handle Supabase redirects */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify" element={<AuthCallback />} />
          <Route path="/verify" element={<AuthCallback />} />

          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="brands" element={<Brands />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="users" element={<Users />} />
            <Route path="orders" element={<Orders />} />
            
            {/* Import route - restricted to admin and main_admin only */}
            <Route path="import" element={
              <ProtectedRoute requiredPermissions={['admin', 'main_admin']}>
                <Import />
              </ProtectedRoute>
            } />
            
            {/* Settings route - restricted to admin and main_admin only */}
            <Route path="settings" element={
              <ProtectedRoute requiredPermissions={['admin', 'main_admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>

        <FloatingCart />
        <ToastContainer position="top-right" />
      </div>
    </Router>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  );
}