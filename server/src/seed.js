import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Product } from './models/Product.js';

const products = [
  {
    name: 'Orthopedic Dog Bed – Large',
    description: 'Memory foam bed for senior dogs and large breeds. Machine-washable cover.',
    price: 500000,
    stockQuantity: 12,
    imageUrl: '/images/dog-bed.webp',
  },
  {
    name: 'Grain-Free Salmon Kibble 12kg',
    description: 'Complete adult dry food with real salmon as the first ingredient.',
    price: 150000,
    stockQuantity: 30,
    imageUrl: '/images/grain-free-salmon-kibble.webp',
  },
  {
    name: 'Squeaky Duck Plush Toy',
    description: 'Durable plush toy with a built-in squeaker. Machine washable.',
    price: 50000,
    stockQuantity: 0,
    imageUrl: '/images/plush-toy.jpg',
  },
  {
    name: 'Adjustable Nylon Dog Harness',
    description: 'No-pull harness with reflective stitching. Sizes S–XL.',
    price: 75000,
    stockQuantity: 4,
    imageUrl: '/images/harness.jpg',
  },
  {
    name: 'Slow Feeder Puzzle Bowl',
    description: 'Reduces bloating and fast eating with a maze-style feeding surface.',
    price: 100000,
    stockQuantity: 25,
    imageUrl: '/images/slow-feeder.jpg',
  },
  {
    name: 'Waterproof Dog Raincoat',
    description: 'Lightweight, packable raincoat with an adjustable belly strap.',
    price: 150000,
    stockQuantity: 8,
    imageUrl: '/images/raincoat.jpg',
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
