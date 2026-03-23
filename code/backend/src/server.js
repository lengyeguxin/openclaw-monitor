const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// 导入中间件
const { corsMiddleware, preflightMiddleware } = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');

// 导入路由
const apiRoute = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库路径（绝对路径）
const DB_PATH = '/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db';

// 创建数据库实例
const db = require('./config/database');

// 中间件
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 日志中间件
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API 路由
app.use('/api/v1', apiRoute);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'openclaw-monitor-backend'
  });
});

// 统一错误处理
app.use(errorHandler);

// 404 处理
app.use((req, res, next) => {
  res.status(404).json({
    code: 40002,
    error: {
      type: 'NotFound',
      message: `接口不存在: ${req.method} ${req.path}`
    }
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await db.connect();
    console.log('✓ Database connected');

    // 初始化数据库模式
    await db.initializeSchema();

    // 加载初始数据（如果表为空）
    const checkResult = await new Promise((resolve) => {
      db.getDb().get('SELECT name FROM sqlite_master WHERE type="table" AND name="agents"', (err, row) => {
        resolve(row);
      });
    });

    if (!checkResult) {
      await db.loadInitialData();
    }

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Database: ${DB_PATH}`);
      console.log(`✓ API: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// 关闭服务器
function shutdown() {
  console.log('\nShutting down server...');
  db.close().then(() => {
    console.log('Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
