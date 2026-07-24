import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { isValidObjectId, isPositiveInteger, sanitizeShippingAddress } from '../utils/validation.js';

function validateCheckoutInput(productId, quantity) {
  if (!isValidObjectId(productId)) {
    return { error: { status: 400, message: 'Invalid product' } };
  }
  if (!isPositiveInteger(quantity)) {
    return { error: { status: 400, message: 'Quantity must be a positive integer' } };
  }
  return {};
}

// Read-only pricing preview so the checkout page can show a server-computed
// total before the order is actually created. No side effects, no reservation.
export async function quote(req, res) {
  const { productId, quantity } = req.body;
  const { error } = validateCheckoutInput(productId, quantity);
  if (error) return res.status(error.status).json({ message: error.message });

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  if (product.stockQuantity < quantity) {
    return res.status(400).json({ message: 'Not enough stock available' });
  }

  const total = product.price * quantity;
  res.json({
    product: { id: product._id, name: product.name, price: product.price, imageUrl: product.imageUrl },
    quantity,
    total,
  });
}

export async function checkout(req, res) {
  const { productId, quantity, shippingAddress: rawShippingAddress } = req.body;

  const { error } = validateCheckoutInput(productId, quantity);
  if (error) return res.status(error.status).json({ message: error.message });

  const shippingAddress = sanitizeShippingAddress(rawShippingAddress);
  if (!shippingAddress) {
    return res.status(400).json({ message: 'Invalid shipping address' });
  }

  // Atomically checks and decrements stock in one operation so two
  // concurrent checkouts can't both pass the check before either decrements
  // (TOCTOU race) — stock can never go negative or be oversold.
  const product = await Product.findOneAndUpdate(
    { _id: productId, stockQuantity: { $gte: quantity } },
    { $inc: { stockQuantity: -quantity } },
    { new: true }
  );
  if (!product) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(400).json({ message: 'Not enough stock available' });
  }

  // Total is derived from the DB price and the validated quantity only —
  // any price or total sent by the client is ignored.
  const total = product.price * quantity;

  const order = await Order.create({
    userId: req.userId,
    productId: product._id,
    quantity,
    priceAtPurchase: product.price,
    shippingAddress,
    status: 'pending',
  });

  // TODO: Stripe PaymentIntent here — create a PaymentIntent for `total` pence,
  // return its client secret to the frontend, and flip the order to 'paid'
  // once payment is confirmed (e.g. via a Stripe webhook).

  res.status(201).json({ order, total });
}
