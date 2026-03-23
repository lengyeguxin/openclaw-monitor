const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const corsMiddleware = cors(corsOptions);

// 处理 OPTIONS 预检请求
const preflightMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Origin': corsOptions.origin,
      'Access-Control-Allow-Methods': corsOptions.methods.join(', '),
      'Access-Control-Allow-Headers': corsOptions.allowedHeaders.join(', '),
      'Access-Control-Max-Age': '86400',
      'Content-Length': '0'
    };
    res.writeHead(204, headers);
    res.end();
    return;
  }
  next();
};

module.exports = {
  corsMiddleware,
  preflightMiddleware
};
