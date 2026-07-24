import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useRequireAdmin } from '../hooks/useRequireAdmin';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'failed'];

export default function AdminDashboard() {
  const ready = useRequireAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    apiClient
      .get('/admin/orders')
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError('Could not load orders'))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready || loading) return <p className="page">Loading...</p>;
  if (error) return <div className="page"><p role="alert">{error}</p></div>;

  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="card stat-tile">
          <span className="stat-tile__value">{orders.length}</span>
          <span className="stat-tile__label">Total orders</span>
        </div>
        {STATUSES.map((status) => (
          <div className="card stat-tile" key={status}>
            <span className="stat-tile__value">{counts[status]}</span>
            <span className="stat-tile__label">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
