import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required.'],
    trim: true,
    minlength: 2,
    maxlength: 160,
  },
  description: {
    type: String,
    required: [true, 'Description is required.'],
    trim: true,
    maxlength: 5000,
  },
  price: {
    type: Number,
    required: [true, 'Price is required.'],
    min: [0, 'Price cannot be negative.'],
  },
  originalPrice: {
    type: Number,
    default: null,
    min: [0, 'Original price cannot be negative.'],
  },
  category: {
    type: String,
    required: [true, 'Category is required.'],
    trim: true,
    maxlength: 80,
  },
  brand: {
    type: String,
    required: [true, 'Brand is required.'],
    trim: true,
    maxlength: 80,
  },
  image: {
    type: String,
    required: [true, 'Product image is required.'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required.'],
    min: [0, 'Stock cannot be negative.'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number.',
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

productSchema.index({ productName: 'text', description: 'text', brand: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
