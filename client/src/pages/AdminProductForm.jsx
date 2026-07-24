import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { rupeesToPence } from '../utils/money';
import { useRequireAdmin } from '../hooks/useRequireAdmin';

export default function AdminProductForm() {
  const ready = useRequireAdmin();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRs, setPriceRs] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !isEditing) return;
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        const product = res.data.product;
        setName(product.name);
        setDescription(product.description || '');
        setPriceRs(String(Math.round(product.price / 100)));
        setStockQuantity(String(product.stockQuantity));
        setImageUrl(product.imageUrl || '');
      })
      .catch(() => setError('Could not load product'))
      .finally(() => setLoading(false));
  }, [ready, isEditing, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name,
      description,
      price: rupeesToPence(priceRs),
      stockQuantity: Number(stockQuantity),
      imageUrl: imageUrl || undefined,
    };

    try {
      if (isEditing) {
        await apiClient.patch(`/admin/products/${id}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <h1>{isEditing ? 'Edit product' : 'Add product'}</h1>
      <form className="card admin-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="price">Price (Rs)</label>
          <input
            id="price"
            type="number"
            min="0"
            step="1"
            value={priceRs}
            onChange={(e) => setPriceRs(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="stockQuantity">Stock quantity</label>
          <input
            id="stockQuantity"
            type="number"
            min="0"
            step="1"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="imageUrl">Image path</label>
          <input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/images/example.jpg"
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add product'}
          </button>
          <button type="button" onClick={() => navigate('/admin')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
