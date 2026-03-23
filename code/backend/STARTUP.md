# OpenClaw Monitor 后端服务启动说明

## 启动命令

```bash
cd /home/my/.openclaw/ai-project/openclaw-monitor/code/backend

# 启动服务器
npm start

# 开发模式（推荐）
npm run dev
```

## 访问端点

- 健康检查：http://localhost:3001/health
- API 文档：http://localhost:3001/api/v1
- 数据库文件：/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db

## 启动成功示例

```
✓ Database connected and foreign keys enabled
✓ Database connected
✓ Database schema initialized
✓ Server running on http://localhost:3001
✓ Database: /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db
✓ API: http://localhost:3001/api/v1
```

## 测试 API

```bash
# 获取智能体列表
curl http://localhost:3001/api/v1/agents

# 获取项目列表
curl http://localhost:3001/api/v1/projects

# 健康检查
curl http://localhost:3001/health
```

## 项目已完成

- ✅ Node.js + Express 项目初始化
- ✅ SQLite 数据库初始化模块
- ✅ 智能体管理 API（6个接口）
- ✅ 项目管理 API（5个接口）
- ✅ 阶段管理 API（3个接口）
- ✅ 任务管理 API（7个接口）
- ✅ 参数校验和错误处理
- ✅ 分页查询支持
- ✅ 代码模块化（routes/services/models分离）
- ✅ Git 提交记录
- ✅ 详细文档
