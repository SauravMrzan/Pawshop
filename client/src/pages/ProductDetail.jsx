import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';
import { stockStatus } from '../utils/stock';
import PawIcon from '../components/PawIcon';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data.product);
        setQuantity(res.data.product.stockQuantity > 0 ? 1 : 0);
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleQuantityChange(e) {
    if (!product) return;
    const raw = Number(e.target.value);
    if (!Number.isFinite(raw)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(raw)), product.stockQuantity);
    setQuantity(clamped);
  }

  async function handleBuyNow() {
    const checkoutPath = `/checkout?productId=${product._id}&quantity=${quantity}`;
    setRedirecting(true);
    try {
      await apiClient.get('/auth/me');
      navigate(checkoutPath);
    } catch {
      navigate(`/login?redirect=${encodeURIComponent(checkoutPath)}`);
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error || !product) return <div className="page"><p role="alert">{error || 'Product not found'}</p></div>;

  const status = stockStatus(product.stockQuantity);
  const outOfStock = product.stockQuantity <= 0;

  return (
    <div className="page product-detail">
      <div className="product-detail__image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <span className="image-placeholder">
            <PawIcon />
            <span>No image yet</span>
          </span>
        )}
      </div>
      <div className="product-detail__info">
        <span className={`badge ${status.className}`}>{status.label}</span>
        <h1>{product.name}</h1>
        <p className="product-card__price">{formatPence(product.price)}</p>
        {product.description && (
          <p className="product-detail__description" style={{ whiteSpace: 'pre-wrap' }}>
            {product.description}
          </p>
        )}

        <div className="quantity-field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            max={product.stockQuantity}
            value={quantity}
            onChange={handleQuantityChange}
            disabled={outOfStock}
          />
        </div>

        <button className="btn btn-primary" onClick={handleBuyNow} disabled={outOfStock || redirecting}>
          {outOfStock ? 'Out of stock' : 'Buy now'}
        </button>
      </div>
    </div>
  );
}
