const { body, param, query, validationResult } = require('express-validator');

// 统一错误响应格式
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 如果是 Express 验证错误
  if (err instanceof Error && err.name === 'ValidationError') {
    return res.status(400).json({
      code: 40001,
      error: {
        type: 'ValidationError',
        message: '参数校验失败',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.msg
        }))
      }
    });
  }

  // 如果是 SQLite 错误
  if (err.code === 'SQLITE_ERROR' || err.errno) {
    return res.status(500).json({
      code: 50001,
      error: {
        type: 'DatabaseError',
        message: '数据库错误',
        details: [{ message: err.message }]
      }
    });
  }

  // 404 错误
  if (err.statusCode === 404 || err.status === 404) {
    return res.status(404).json({
      code: 40002,
      error: {
        type: 'NotFound',
        message: '资源不存在',
        details: [{ message: err.message }]
      }
    });
  }

  // 其他错误
  return res.status(500).json({
    code: 50000,
    error: {
      type: 'InternalError',
      message: '服务器内部错误',
      details: [{ message: process.env.NODE_ENV === 'production' ? ' Internal error' : err.message }]
    }
  });
};

// 参数验证错误处理
const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 40001,
      error: {
        type: 'ValidationError',
        message: '参数校验失败',
        details: errors.array().map(e => ({
          field: e.path,
          message: e.msg
        }))
      }
    });
  }
  next();
};

// 资源不存在处理
const resourceNotFound = (message = '资源不存在') => (req, res, next) => {
  const err = new Error(message);
  err.statusCode = 404;
  next(err);
};

module.exports = {
  errorHandler,
  validationHandler,
  resourceNotFound
};
