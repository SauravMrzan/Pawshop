import { Product } from '../models/Product.js';
import { isValidObjectId, isNonEmptyString, isNonNegativeInteger } from '../utils/validation.js';

// Explicitly whitelists and validates each field from the raw request body —
// never spreads req.body into a create/update call. `partial` controls
// whether an absent field is left alone (update) or required (create).
function validateProductFields(body, { partial } = {}) {
  const fields = {};

  if (!partial || body.name !== undefined) {
    if (!isNonEmptyString(body.name, 200)) {
      return { error: 'name must be a non-empty string' };
    }
    fields.name = body.name.trim();
  }

  if (!partial || body.description !== undefined) {
    if (body.description !== undefined && typeof body.description !== 'string') {
      return { error: 'description must be a string' };
    }
    fields.description = (body.description ?? '').trim();
  }

  if (!partial || body.price !== undefined) {
    if (!isNonNegativeInteger(body.price)) {
      return { error: 'price must be an integer number of pence' };
    }
    fields.price = body.price;
  }

  if (!partial || body.stockQuantity !== undefined) {
    if (!isNonNegativeInteger(body.stockQuantity)) {
      return { error: 'stockQuantity must be a non-negative integer' };
    }
    fields.stockQuantity = body.stockQuantity;
  }

  if (body.imageUrl !== undefined) {
    if (body.imageUrl !== null && typeof body.imageUrl !== 'string') {
      return { error: 'imageUrl must be a string' };
    }
    fields.imageUrl = body.imageUrl || undefined;
  }

  return { fields };
}

export async function createProduct(req, res) {
  const { fields, error } = validateProductFields(req.body);
  if (error) return res.status(400).json({ message: error });

  const product = await Product.create(fields);
  return res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const { fields, error } = validateProductFields(req.body, { partial: true });
  if (error) return res.status(400).json({ message: error });
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  Object.assign(product, fields);
  await product.save();

  return res.json({ product });
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.status(204).send();
}
