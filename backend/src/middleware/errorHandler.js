export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid file type.',
    });
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the 5MB limit.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field.';
    }
    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
