import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';
import { stockStatus } from '../utils/stock';
import { useRequireAdmin } from '../hooks/useRequireAdmin';

export default function AdminProducts() {
  const ready = useRequireAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!ready) return;
    apiClient
      .get('/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Could not load products'))
      .finally(() => setLoading(false));
  }, [ready]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product._id);
    try {
      await apiClient.delete(`/admin/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete product');
    } finally {
      setDeletingId(null);
    }
  };

  if (!ready || loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <div className="admin-header">
        <h1>Manage products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>

      {error && <p role="alert">{error}</p>}

      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <div className="admin-list">
          {products.map((product) => {
            const status = stockStatus(product.stockQuantity);
            return (
              <div className="admin-row card" key={product._id}>
                <div className="admin-row__info">
                  <span className="admin-row__name">{product.name}</span>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>
                <span className="admin-row__price">{formatPence(product.price)}</span>
                <span className="admin-row__stock">{product.stockQuantity} in stock</span>
                <div className="admin-row__actions">
                  <Link to={`/admin/products/${product._id}/edit`} className="btn">
                    Edit
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(product)}
                    disabled={deletingId === product._id}
                  >
                    {deletingId === product._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
