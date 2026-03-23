# OpenClaw Monitor 后端服务

轻量级智能体监控系统后端 API 服务，基于 Node.js + Express + SQLite 构建。

## 技术栈

- **Node.js** >= 18.x
- **Express** ^4.18.2
- **SQLite3** ^5.1.6
- **CORS** ^2.8.5
- **Helmet** ^7.1.0
- **Express Validator** ^7.0.1
- **UUID** ^9.0.0

## 功能特性

- ✅ 智能体管理（CRUD + 状态上报）
- ✅ 项目管理（CRUD + 进度计算）
- ✅ 阶段管理（CRUD + 前置条件检查）
- ✅ 任务管理（CRUD + 智能体分配 + 进度上报）
- ✅ SQLite 数据库（零配置）
- ✅ 分页查询支持
- ✅ 参数验证与错误处理
- ✅ CORS 支持

## API 端点

### 智能体管理
- `GET /api/v1/agents` - 获取智能体列表
- `POST /api/v1/agents` - 创建智能体
- `GET /api/v1/agents/:id` - 获取智能体详情
- `PATCH /api/v1/agents/:id/status` - 更新智能体状态
- `POST /api/v1/agents/:id/status-report` - 智能体状态上报
- `POST /api/v1/agents/batch-import` - 批量导入智能体

### 项目管理
- `GET /api/v1/projects` - 获取项目列表
- `POST /api/v1/projects` - 创建项目
- `GET /api/v1/projects/:id` - 获取项目详情
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目

### 阶段管理
- `GET /api/v1/projects/:project_id/stages` - 获取阶段列表
- `POST /api/v1/projects/:project_id/stages` - 创建阶段
- `PUT /api/v1/stages/:id` - 更新阶段

### 任务管理
- `GET /api/v1/tasks` - 获取任务列表
- `POST /api/v1/tasks` - 创建任务
- `GET /api/v1/tasks/:id` - 获取任务详情
- `PUT /api/v1/tasks/:id` - 更新任务
- `POST /api/v1/tasks/:id/assign` - 分配智能体到任务
- `DELETE /api/v1/tasks/:id/agents/:agent_id` - 移除智能体分配
- `POST /api/v1/tasks/:id/progress-report` - 任务进度上报

## 启动方法

### 1. 安装依赖
```bash
cd code/backend
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并根据需要修改：
```bash
cp .env.example .env
```

### 3. 启动服务器
```bash
npm start
```

开发模式（热重载）：
```bash
npm run dev
```

### 4. 访问 API
- 健康检查：http://localhost:3001/health
- API 文档：http://localhost:3001/api/v1
- 数据库文件：`/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db`

## 项目结构

```
code/backend/
├── package.json
├── .env
├── src/
│   ├── server.js          # 主入口
│   ├── models/            # 数据模型层
│   │   ├── database.js    # 数据库连接和初始化
│   │   ├── baseModel.js   # 基础模型类
│   │   ├── agentModel.js  # 智能体模型
│   │   ├── projectModel.js # 项目模型
│   │   ├── stageModel.js  # 阶段模型
│   │   └── taskModel.js   # 任务模型
│   ├── services/          # 业务逻辑层
│   │   ├── agentService.js
│   │   ├── projectService.js
│   │   ├── stageService.js
│   │   └── taskService.js
│   ├── routes/            # 路由层
│   │   ├── api.js         # API 路由汇总
│   │   ├── agents.js      # 智能体路由
│   │   ├── projects.js    # 项目路由
│   │   ├── stages.js      # 阶段路由
│   │   └── tasks.js       # 任务路由
│   └── middleware/        # 中间件
│       ├── cors.js        # CORS 中间件
│       ├── errorHandler.js # 错误处理
│       └── validators.js  # 参数验证
└── data/
    └── monitor.db         # SQLite 数据库文件
```

## 数据库设计

详见 `doc/database-schema.md`，包含以下表：

- `agents` - 智能体表
- `projects` - 项目表
- `stages` - 阶段表
- `tasks` - 任务表
- `task_agents` - 任务智能体关联表
- `agent_status_history` - 智能体状态历史表

## 调试

查看日志（开发模式）：
```bash
npm run dev
```

压力测试示例：
```bash
# 获取智能体列表
curl http://localhost:3001/api/v1/agents

# 创建项目
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","description":"测试","stages":[{"name":"阶段1","order":1}]}'
```

## 部署

### 单机部署
```bash
# 构建（如果需要）
cd code/backend
npm install --production

# 启动
PORT=3001 NODE_ENV=production node src/server.js
```

### Docker 部署（可选）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

## 许可证

MIT
