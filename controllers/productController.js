import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const uploadsDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));

function imagePathFromRequest(req, existingImage = '') {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }

  return typeof req.body?.image === 'string' ? req.body.image.trim() : existingImage;
}

function validateProductInput(body, image, { partial = false } = {}) {
  body = body || {};
  const requiredFields = ['productName', 'description', 'price', 'category', 'brand', 'stock'];
  const missing = requiredFields.filter((field) => {
    const value = body[field];
    return !partial && (value === undefined || value === null || String(value).trim() === '');
  });

  if (missing.length) {
    return `Required product fields are missing: ${missing.join(', ')}.`;
  }

  if (partial) {
    const emptyFields = requiredFields.filter((field) => (
      body[field] !== undefined && String(body[field]).trim() === ''
    ));
    if (emptyFields.length) {
      return `Product fields cannot be empty: ${emptyFields.join(', ')}.`;
    }
  }

  for (const field of ['price', 'originalPrice', 'stock']) {
    if (body[field] !== undefined && body[field] !== '' && !Number.isFinite(Number(body[field]))) {
      return `${field} must be a valid number.`;
    }
  }

  if (body.stock !== undefined && body.stock !== '' && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) {
    return 'Stock must be a non-negative whole number.';
  }

  if (body.price !== undefined && Number(body.price) < 0) {
    return 'Price cannot be negative.';
  }

  if (body.originalPrice !== undefined && body.originalPrice !== '' && Number(body.originalPrice) < 0) {
    return 'Original price cannot be negative.';
  }

  if (body.status !== undefined && !['active', 'inactive'].includes(body.status)) {
    return 'Status must be active or inactive.';
  }

  if (!partial && !image) {
    return 'A product image is required.';
  }

  return null;
}

function removeUploadedImage(image) {
  if (!image?.startsWith('/uploads/')) {
    return;
  }

  const filename = path.basename(image);
  const filePath = path.resolve(uploadsDirectory, filename);

  if (filePath.startsWith(path.resolve(uploadsDirectory) + path.sep) && existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

function queryForProducts(req, includeInactive) {
  const filter = includeInactive ? {} : { status: 'active' };

  if (req.query.category) {
    filter.category = new RegExp(`^${String(req.query.category).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 100);
    if (search) {
      filter.$or = ['productName', 'description', 'brand', 'category'].map((field) => ({
        [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      }));
    }
  }

  return filter;
}

export async function listProducts(req, res, next) {
  try {
    const includeInactive = req.user?.role === 'admin';
    const filter = queryForProducts(req, includeInactive);
    const sortOptions = {
      newest: { createdAt: -1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      name: { productName: 1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;
    const products = await Product.find(filter).sort(sort).lean();

    return res.status(200).json({
      success: true,
      data: { products, count: products.length },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const filter = { _id: req.params.id };
    if (req.user?.role !== 'admin') {
      filter.status = 'active';
    }
    const product = await Product.findOne(filter).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return next(error);
  }
}

export async function listCategories(req, res, next) {
  try {
    const categories = await Product.distinct('category', { status: 'active' });
    return res.status(200).json({ success: true, data: { categories: categories.sort() } });
  } catch (error) {
    return next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const body = req.body || {};
    const image = imagePathFromRequest(req);
    const validationMessage = validateProductInput(body, image);

    if (validationMessage) {
      removeUploadedImage(image);
      return res.status(400).json({ success: false, message: validationMessage });
    }

    const product = await Product.create({
      productName: body.productName,
      description: body.description,
      price: Number(body.price),
      originalPrice: body.originalPrice === '' || body.originalPrice === undefined || body.originalPrice === null
        ? null
        : Number(body.originalPrice),
      category: body.category,
      brand: body.brand,
      stock: Number(body.stock),
      status: body.status || 'active',
      image,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product },
    });
  } catch (error) {
    if (req.file) {
      removeUploadedImage(`/uploads/${req.file.filename}`);
    }
    return next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const body = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id)) {
      removeUploadedImage(imagePathFromRequest(req));
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      removeUploadedImage(imagePathFromRequest(req));
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousImage = product.image;
    const image = imagePathFromRequest(req, previousImage);
    const validationMessage = validateProductInput(body, image, { partial: true });

    if (validationMessage) {
      removeUploadedImage(image);
      return res.status(400).json({ success: false, message: validationMessage });
    }

    const allowedFields = ['productName', 'description', 'price', 'originalPrice', 'category', 'brand', 'stock', 'status'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        product[field] = field === 'price' || field === 'stock'
          ? Number(body[field])
          : field === 'originalPrice'
            ? (body[field] === '' || body[field] === null ? null : Number(body[field]))
            : body[field];
      }
    }
    product.image = image;
    await product.save();

    if (req.file && previousImage !== image) {
      removeUploadedImage(previousImage);
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    if (req.file) {
      removeUploadedImage(`/uploads/${req.file.filename}`);
    }
    return next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    removeUploadedImage(product.image);
    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}
