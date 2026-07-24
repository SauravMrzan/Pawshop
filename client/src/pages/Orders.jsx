import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/orders/mine')
      .then((res) => setOrders(res.data.orders))
      .catch((err) => {
        if (err.response?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent('/orders')}`);
        } else {
          setError('Could not load orders');
        }
      });
  }, [navigate]);

  if (error) return <div className="page"><p role="alert">{error}</p></div>;
  if (!orders) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div className="order-row card" key={order._id}>
              <div className="order-row__info">
                <span className="order-row__product">{order.productId?.name || 'Product'}</span>
                <span className="order-row__date">
                  Placed {new Date(order.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
              <span className={`badge badge-status-${order.status}`}>{order.status}</span>
              <span className="order-row__total">{formatPence(order.priceAtPurchase * order.quantity)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
