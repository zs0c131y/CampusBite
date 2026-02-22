import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

// Auth pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import ProfilePage from '@/pages/ProfilePage'

// Student pages
import StoresPage from '@/pages/student/StoresPage'
import StoreMenuPage from '@/pages/student/StoreMenuPage'
import CartPage from '@/pages/student/CartPage'
import CheckoutPage from '@/pages/student/CheckoutPage'
import OrderTrackingPage from '@/pages/student/OrderTrackingPage'
import OrderHistoryPage from '@/pages/student/OrderHistoryPage'

// Store pages
import StoreDashboardPage from '@/pages/store/StoreDashboardPage'
import StoreOrdersPage from '@/pages/store/StoreOrdersPage'
import MenuManagementPage from '@/pages/store/MenuManagementPage'
import StoreSettingsPage from '@/pages/store/StoreSettingsPage'
import OrderDetailPage from '@/pages/store/OrderDetailPage'

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LandingPage />
  if (user?.role === 'store_employee') return <Navigate to="/store/dashboard" replace />
  return <Navigate to="/stores" replace />
}

function App() {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  const publicAuthRoutes = new Set([
    '/login',
    '/register',
    '/forgot-password',
  ])
  const isAuthRoute =
    publicAuthRoutes.has(location.pathname) ||
    location.pathname.startsWith('/reset-password/') ||
    location.pathname.startsWith('/verify-email/')
  const isPublicLanding = location.pathname === '/' && !isAuthenticated
  const hideNavbar = isAuthRoute || isPublicLanding
  const fluid = hideNavbar

  return (
    <Layout hideNavbar={hideNavbar} fluid={fluid}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        {/* Common authenticated route */}
        <Route path="/profile" element={
          <ProtectedRoute roles={['student', 'faculty', 'store_employee']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Student/Faculty routes */}
        <Route path="/stores" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <StoresPage />
          </ProtectedRoute>
        } />
        <Route path="/stores/:id" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <StoreMenuPage />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <CartPage />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <OrderHistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute roles={['student', 'faculty']}>
            <OrderTrackingPage />
          </ProtectedRoute>
        } />

        {/* Store employee routes */}
        <Route path="/store/dashboard" element={
          <ProtectedRoute roles={['store_employee']}>
            <StoreDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/store/orders" element={
          <ProtectedRoute roles={['store_employee']}>
            <StoreOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/store/orders/:id" element={
          <ProtectedRoute roles={['store_employee']}>
            <OrderDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/store/menu" element={
          <ProtectedRoute roles={['store_employee']}>
            <MenuManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/store/settings" element={
          <ProtectedRoute roles={['store_employee']}>
            <StoreSettingsPage />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
