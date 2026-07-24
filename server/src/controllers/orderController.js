import { Order } from '../models/Order.js';
import { isValidObjectId } from '../utils/validation.js';

export async function myOrders(req, res) {
  const orders = await Order.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .populate('productId', 'name imageUrl');

  res.json({ orders });
}

export async function getOrder(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Ownership is enforced in the query itself, not checked after the fact —
  // an order that exists but belongs to someone else looks identical to one
  // that doesn't exist at all.
  const order = await Order.findOne({ _id: id, userId: req.userId }).populate('productId', 'name imageUrl');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({ order });
}
