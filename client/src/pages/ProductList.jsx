import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';
import { stockStatus } from '../utils/stock';
import PawIcon from '../components/PawIcon';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Could not load products'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p role="alert">{error}</p></div>;

  return (
    <div className="page">
      <section className="hero">
        <p className="hero__eyebrow">
          <PawIcon /> PawShop
        </p>
        <h1>Everything for a happy pup</h1>
        <p className="hero__subtitle">
          Thoughtfully chosen food, gear, and toys — picked the way we'd shop for our own dogs.
        </p>
      </section>

      <section className="shop-section" aria-labelledby="shop-heading">
        <h2 id="shop-heading">Shop all products</h2>
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const status = stockStatus(product.stockQuantity);
              return (
                <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                  <div className="product-card__image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span className="image-placeholder">
                        <PawIcon />
                        <span>No image yet</span>
                      </span>
                    )}
                  </div>
                  <div className="product-card__body">
                    <span className={`badge ${status.className}`}>{status.label}</span>
                    <span className="product-card__name">{product.name}</span>
                    <span className="product-card__price">{formatPence(product.price)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
