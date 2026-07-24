import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'price must be an integer number of pence',
      },
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'stockQuantity must be an integer',
      },
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    strict: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Product = mongoose.model('Product', productSchema);
