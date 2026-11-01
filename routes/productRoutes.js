import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from '../controllers/productController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../utils/upload.js';

const router = Router();

function optionalAuth(req, res, next) {
  const hasCookie = Boolean(req.cookies?.token);
  const hasBearer = req.headers.authorization?.startsWith('Bearer ');

  if (!hasCookie && !hasBearer) {
    return next();
  }

  return authMiddleware(req, res, next);
}

router.get('/categories', listCategories);
router.get('/admin', authMiddleware, adminMiddleware, listProducts);
router.get('/', optionalAuth, listProducts);
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), createProduct);
router.get('/:id', optionalAuth, getProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;
