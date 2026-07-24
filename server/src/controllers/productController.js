import { Product } from '../models/Product.js';
import { isValidObjectId } from '../utils/validation.js';

export async function listProducts(_req, res) {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ products });
}

export async function getProduct(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ product });
}
