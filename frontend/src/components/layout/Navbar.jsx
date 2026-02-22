import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Store,
  ClipboardList,
  Settings,
  LogOut,
  ChefHat,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { getItemCount } = useCart()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const itemCount = getItemCount()
  const isStoreEmployee = user?.role === 'store_employee'

  const handleLogout = async () => {
    await logout()
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="group flex items-center space-x-2 text-xl font-bold text-primary"
            >
              <ChefHat className="h-7 w-7 transition-transform duration-200 group-hover:-translate-y-0.5" />
              <span className="font-display tracking-tight">CampusBite</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            ) : isStoreEmployee ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/store/dashboard" className="flex items-center space-x-1">
                    <Store className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/store/orders" className="flex items-center space-x-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>Orders</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/store/menu" className="flex items-center space-x-1">
                    <ChefHat className="h-4 w-4" />
                    <span>Menu</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/store/settings" className="flex items-center space-x-1">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </Button>
                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="relative"
                    aria-label="Open account menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/stores" className="flex items-center space-x-1">
                    <Store className="h-4 w-4" />
                    <span>Browse Stores</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/orders" className="flex items-center space-x-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>My Orders</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/cart" className="relative flex items-center space-x-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Cart</span>
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </Link>
                </Button>
                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="relative"
                    aria-label="Open account menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {isAuthenticated && !isStoreEmployee && itemCount > 0 && (
              <Button variant="ghost" size="icon" asChild className="mr-1">
                <Link to="/cart" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-white bg-primary hover:bg-primary/90 text-center"
                >
                  Register
                </Link>
              </>
            ) : isStoreEmployee ? (
              <>
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>
                <Link
                  to="/store/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Store className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
                <Link
                  to="/store/orders"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ClipboardList className="h-5 w-5 mr-3" />
                  Orders
                </Link>
                <Link
                  to="/store/menu"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChefHat className="h-5 w-5 mr-3" />
                  Menu
                </Link>
                <Link
                  to="/store/settings"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 mt-2 border-t border-gray-100 pt-3"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>
                <Link
                  to="/stores"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Store className="h-5 w-5 mr-3" />
                  Browse Stores
                </Link>
                <Link
                  to="/orders"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ClipboardList className="h-5 w-5 mr-3" />
                  My Orders
                </Link>
                <Link
                  to="/cart"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  Cart
                  {itemCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 px-2 rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 mt-2 border-t border-gray-100 pt-3"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
