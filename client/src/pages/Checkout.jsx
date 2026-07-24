import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPence } from '../utils/money';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('productId');
  const quantity = Number(searchParams.get('quantity')) || 1;

  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  useEffect(() => {
    if (!productId) {
      navigate('/');
      return;
    }

    apiClient
      .post('/checkout/quote', { productId, quantity })
      .then((res) => setQuoteData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          const redirect = `/checkout?productId=${productId}&quantity=${quantity}`;
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        } else {
          setError(err.response?.data?.message || 'Could not load checkout');
        }
      })
      .finally(() => setLoading(false));
  }, [productId, quantity, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      // Only ids/quantity/address are sent — price and total are never
      // computed here, they come back from the server on success.
      await apiClient.post('/checkout', {
        productId,
        quantity,
        shippingAddress: { name, line1, city, postcode },
      });
      navigate('/orders');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p role="alert">{error}</p></div>;
  if (!quoteData) return null;

  return (
    <div className="page checkout">
      <h1>Checkout</h1>
      <div className="checkout__layout">
        <form className="checkout__form card" onSubmit={handleSubmit}>
          <h2>Shipping address</h2>
          <div>
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="line1">Address</label>
            <input id="line1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="city">City</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="postcode">Postcode</label>
            <input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} required />
          </div>
          {submitError && <p role="alert">{submitError}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Continue to payment'}
          </button>
        </form>

        <div className="checkout__summary card">
          <h2>Order summary</h2>
          <div className="order-summary-row">
            <span>{quoteData.product.name} × {quoteData.quantity}</span>
            <span>{formatPence(quoteData.total)}</span>
          </div>
          <div className="order-summary-row order-summary-row--total">
            <span>Total</span>
            <span>{formatPence(quoteData.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
