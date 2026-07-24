import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import PawIcon from './PawIcon';

export default function Nav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Nav sits outside <Routes> and never unmounts, so it has to re-check
  // auth on every navigation (not just once on first load) or it goes
  // stale the moment you log in/out/switch accounts without a hard refresh.
  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => setIsAdmin(res.data.user.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [location.pathname]);

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main">
        <Link to="/" className="brand">
          <PawIcon className="brand__icon" />
          <span className="brand__word">PawShop</span>
        </Link>
        <div className="nav__links">
          {isAdmin ? (
            <>
              <NavLink to="/admin/dashboard" className="nav__link">
                Dashboard
              </NavLink>
              <NavLink to="/admin/orders" className="nav__link">
                Manage Orders
              </NavLink>
              <NavLink to="/admin/products" className="nav__link">
                Products
              </NavLink>
              <NavLink to="/dashboard" className="nav__link">
                Account
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end className="nav__link">
                Shop
              </NavLink>
              <NavLink to="/orders" className="nav__link">
                My Orders
              </NavLink>
              <NavLink to="/dashboard" className="nav__link">
                Account
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
