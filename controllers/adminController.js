import Product from '../models/Product.js';
import User from '../models/User.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [totalProducts, totalUsers, availableProducts, outOfStockProducts] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ status: 'active', stock: { $gt: 0 } }),
      Product.countDocuments({ stock: 0 }),
    ]);

    return res.status(200).json({
      success: true,
      data: { totalProducts, totalUsers, availableProducts, outOfStockProducts },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find({ role: 'user' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { users, count: users.length },
    });
  } catch (error) {
    return next(error);
  }
}
