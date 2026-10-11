import { createElement, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingCart,
  User,
  Store,
  ClipboardList,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/Brand";

const studentLinks = [
  { to: "/stores", label: "Browse outlets", icon: Store },
  { to: "/orders", label: "My orders", icon: ClipboardList },
];
const storeLinks = [
  { to: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/store/orders", label: "Orders", icon: ClipboardList },
  { to: "/store/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/store/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isStore = user?.role === "store_employee";
  const links = isStore ? storeLinks : studentLinks;
  const count = getItemCount();
  const signOut = async () => {
    await logout();
    setMenuOpen(false);
    setAccountOpen(false);
    navigate("/login");
  };
  const brand = <Brand />;
  const currentSection =
    storeLinks.find(({ to }) => pathname.startsWith(to))?.label || "Account";
  return (
    <>
      {isStore && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-foreground px-5 py-8 text-background lg:flex">
          {brand}
          <p className="eyebrow mb-6 mt-10 text-background/45">
            Store workspace
          </p>
          <nav aria-label="Store navigation" className="space-y-2">
            {storeLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                {createElement(icon, { size: 19 })}
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-background/20 pt-6">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <Link
              to="/profile"
              className="mt-2 block text-xs text-background/60"
            >
              Account settings
            </Link>
            <button
              onClick={signOut}
              className="mt-5 flex items-center gap-2 text-sm text-background/70"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>
      )}
      <header className="sticky top-0 z-40 border-b bg-background/95 [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
          <div className={isStore ? "lg:hidden" : ""}>{brand}</div>
          {isStore && (
            <p className="hidden text-sm text-muted-foreground lg:block">
              Store management <span className="mx-2 text-border">/</span>
              <span className="font-semibold text-foreground">
                {currentSection}
              </span>
            </p>
          )}
          <nav
            aria-label="Main navigation"
            className={
              isStore
                ? "hidden items-center gap-2 md:flex lg:hidden"
                : "hidden items-center gap-2 md:flex"
            }
          >
            {isAuthenticated &&
              links.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`
                  }
                >
                  {createElement(icon, { size: 17 })}
                  {label}
                </NavLink>
              ))}
            {!isAuthenticated && (
              <>
                <a
                  href="/#how-it-works"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  How it works
                </a>
                <a
                  href="/#for-stores"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  For stores
                </a>
              </>
            )}
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            {isAuthenticated ? (
              <>
                {isStore && pathname !== "/store/orders" && (
                  <Button
                    variant="outline"
                    className="hidden lg:inline-flex"
                    asChild
                  >
                    <Link to="/store/orders">
                      <ClipboardList size={17} /> View orders
                    </Link>
                  </Button>
                )}
                {!isStore && (
                  <Button
                    asChild
                    className="hidden bg-foreground text-background hover:bg-foreground/85 md:inline-flex"
                  >
                    <Link to="/cart">
                      <ShoppingCart size={17} /> Cart{" "}
                      <span className="ml-1 rounded-full bg-accent px-2 text-xs text-foreground">
                        {count}
                      </span>
                    </Link>
                  </Button>
                )}
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    className="grid h-10 w-10 place-items-center rounded-full border bg-secondary text-sm font-bold"
                  >
                    {user?.name?.slice(0, 1).toUpperCase() || (
                      <User size={18} />
                    )}
                  </button>
                  {accountOpen && (
                    <>
                      <button
                        className="fixed inset-0 z-40 cursor-default"
                        aria-label="Close account menu"
                        onClick={() => setAccountOpen(false)}
                      />
                      <div className="absolute right-0 top-13 z-50 w-60 rounded-2xl border bg-card p-2 shadow-lg">
                        <div className="border-b p-3">
                          <p className="truncate text-sm font-semibold">
                            {user?.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-secondary"
                        >
                          <User size={16} /> My account
                        </Link>
                        <button
                          onClick={signOut}
                          className="flex w-full items-center gap-2 rounded-lg p-3 text-sm text-destructive hover:bg-destructive/5"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {isStore && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label={
                      menuOpen ? "Close navigation" : "Open navigation"
                    }
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" className="px-2 sm:px-4" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button className="px-3 sm:px-4" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        {!isAuthenticated && (
          <nav
            aria-label="Public navigation"
            className="flex justify-center gap-6 border-t py-2 md:hidden"
          >
            <a
              href="/#how-it-works"
              className="px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              How it works
            </a>
            <a
              href="/#for-stores"
              className="px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              For stores
            </a>
          </nav>
        )}
        {isStore && menuOpen && (
          <nav
            aria-label="Mobile store navigation"
            className="grid grid-cols-2 gap-2 border-t p-4 md:hidden"
          >
            {storeLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl p-3 text-sm ${isActive ? "bg-secondary font-semibold" : ""}`
                }
              >
                {createElement(icon, { size: 18 })}
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      {isAuthenticated && !isStore && (
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card px-2 pt-2 [padding-bottom:max(.5rem,env(safe-area-inset-bottom))] md:hidden"
        >
          {[
            ...studentLinks,
            {
              to: "/cart",
              label: count ? `Cart (${count})` : "Cart",
              icon: ShoppingCart,
            },
            { to: "/profile", label: "Account", icon: User },
          ].map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold ${isActive ? "bg-primary/8 text-primary" : "text-muted-foreground"}`
              }
            >
              {createElement(icon, { size: 19 })}
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
