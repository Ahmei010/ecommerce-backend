function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Administrator access is required.',
    });
  }

  return next();
}

export default adminMiddleware;
