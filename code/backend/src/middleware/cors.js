const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const corsMiddleware = cors(corsOptions);

// 处理 OPTIONS 预检请求
const preflightMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const requestOrigin = req.headers.origin;
    const allowedOrigin = corsOptions.origin.includes(requestOrigin)
      ? requestOrigin
      : corsOptions.origin[0];
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': corsOptions.methods.join(', '),
      'Access-Control-Allow-Headers': corsOptions.allowedHeaders.join(', '),
      'Access-Control-Allow-Credentials': 'true',
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
