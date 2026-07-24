import { Link } from 'react-router-dom';
import PawIcon from './PawIcon';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <PawIcon className="site-footer__icon" />
          <span>PawShop</span>
        </div>
        <p className="site-footer__tagline">A small independent dog shop — everything for a happy pup.</p>
        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/">Shop</Link>
          <Link to="/orders">My Orders</Link>
        </nav>
      </div>
    </footer>
  );
}
