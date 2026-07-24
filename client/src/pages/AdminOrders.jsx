import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';
import { useRequireAdmin } from '../hooks/useRequireAdmin';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'failed'];

export default function AdminOrders() {
  const ready = useRequireAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!ready) return;
    apiClient
      .get('/admin/orders')
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError('Could not load orders'))
      .finally(() => setLoading(false));
  }, [ready]);

  const handleStatusChange = async (order, status) => {
    setUpdatingId(order._id);
    setError('');
    try {
      const res = await apiClient.patch(`/admin/orders/${order._id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: res.data.order.status } : o)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!ready || loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <h1>Manage orders</h1>
      {error && <p role="alert">{error}</p>}

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="admin-list">
          {orders.map((order) => (
            <div className="admin-row card" key={order._id}>
              <div className="admin-row__info">
                <span className="admin-row__name">{order.productId?.name || 'Product'}</span>
                <span className="admin-row__stock">
                  {order.userId?.email || 'Unknown user'} · qty {order.quantity}
                </span>
              </div>
              <span className="admin-row__price">{formatPence(order.priceAtPurchase * order.quantity)}</span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order, e.target.value)}
                disabled={updatingId === order._id}
                aria-label={`Status for order ${order._id}`}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
