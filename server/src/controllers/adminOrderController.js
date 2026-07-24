import { Order } from '../models/Order.js';
import { isValidObjectId } from '../utils/validation.js';

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'failed'];

export async function listAllOrders(_req, res) {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('productId', 'name')
    .populate('userId', 'email');

  return res.json({ orders });
}

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (typeof status !== 'string' || !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.status = status;
  await order.save();

  return res.json({ order });
}
