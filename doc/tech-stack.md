# OpenClaw Monitor 技术栈选型文档

## 1. 选型原则

- **简单优先**：避免过度设计，选择成熟稳定的技术
- **本地部署**：无需复杂基础设施，单机可运行
- **易于维护**：代码清晰，文档完善
- **参考现有**：借鉴 agents-dashboard 项目的成功经验

---

## 2. 技术栈总览

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React 18 + Vite + Tailwind CSS | 轻量、快速开发 |
| 后端 | Node.js + Express | 简单、成熟 |
| 数据库 | SQLite | 零配置、本地存储 |
| 状态更新 | HTTP API + 轮询 | 智能体调用API更新状态 |
| 构建 | Vite | 快速热更新 |

---

## 3. 前端技术栈

### 3.1 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| React Router | 6.x | 路由管理 |
| Vite | 5.x | 构建工具 |

### 3.2 UI 组件

| 技术 | 版本 | 用途 |
|------|------|------|
| Tailwind CSS | 3.x | 样式框架 |
| Headless UI | 1.x | 无头组件 |
| Lucide React | latest | 图标库 |

### 3.3 数据请求

| 技术 | 版本 | 用途 |
|------|------|------|
| Axios | 1.x | HTTP客户端 |
| SWR | 2.x | 数据获取与缓存 |

### 3.4 选择理由

- **React 18**：生态成熟，组件化开发
- **Vite**：启动快、热更新快，比 CRA 更轻量
- **Tailwind CSS**：原子化CSS，开发效率高
- **SWR**：自动缓存、重试、实时更新

---

## 4. 后端技术栈

### 4.1 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行时 |
| Express | 4.x | Web框架 |

### 4.2 数据库与ORM

| 技术 | 版本 | 用途 |
|------|------|------|
| SQLite3 | 3.35+ | 数据库 |
| better-sqlite3 | latest | Node.js SQLite驱动 |

### 4.3 中间件

| 技术 | 版本 | 用途 |
|------|------|------|
| cors | latest | 跨域支持 |
| morgan | latest | 请求日志 |
| dotenv | latest | 环境变量 |

### 4.4 状态更新机制

**智能体主动上报**：
- 接收任务时 → 调用 API → 状态改为"任务中"
- 执行任务时 → 调用 API → 更新任务进度
- 结束任务时 → 调用 API → 状态改为"空闲"

**前端获取状态**：
- 用户主动刷新页面
- 或前端定时轮询（如每30秒）

### 4.5 选择理由

- **Express**：简单、文档丰富、社区活跃
- **SQLite**：零配置、单文件存储、适合本地部署
- **better-sqlite3**：同步API，性能更好
- **HTTP API + 轮询**：简单可靠，无需维护WebSocket连接

---

## 5. 项目结构

```
/home/my/.openclaw/ai-project/openclaw-monitor/
├── code/
│   ├── backend/              # 后端代码
│   │   ├── src/
│   │   │   ├── server.js     # 主入口
│   │   │   ├── routes/       # API路由
│   │   │   ├── models/       # 数据模型
│   │   │   ├── services/     # 业务逻辑
│   │   │   └── websocket.js  # WebSocket服务
│   │   ├── package.json
│   │   └── .env
│   └── frontend/             # 前端代码
│       ├── src/
│       │   ├── main.jsx      # 入口
│       │   ├── App.jsx       # 根组件
│       │   ├── components/   # 组件
│       │   ├── pages/        # 页面
│       │   ├── hooks/        # 自定义Hooks
│       │   └── api/          # API客户端
│       ├── index.html
│       ├── package.json
│       └── tailwind.config.js
├── data/                     # 数据库文件
│   └── monitor.db
├── doc/                      # 文档
├── tmp/                      # 临时文件
└── .context/                 # 项目上下文
```

---

## 6. API 设计概览

### 6.1 RESTful API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/agents` | GET | 获取智能体列表 |
| `/api/agents/:id` | GET | 获取智能体详情 |
| `/api/agents/:id/status` | PATCH | 更新智能体状态 |
| `/api/projects` | GET | 获取项目列表 |
| `/api/projects/:id` | GET | 获取项目详情 |
| `/api/projects/:id/stages` | GET | 获取项目阶段 |
| `/api/tasks` | GET | 获取任务列表 |
| `/api/tasks/:id` | GET | 获取任务详情 |
| `/api/dashboard/stats` | GET | 获取仪表盘统计 |

### 6.2 状态更新 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/agents/:id/status` | POST | 智能体上报状态更新 |
| `/api/tasks/:id/progress` | POST | 任务进度更新 |

---

## 7. 数据库设计概览

### 7.1 核心表

| 表名 | 描述 |
|------|------|
| `agents` | 智能体信息 |
| `projects` | 项目信息 |
| `stages` | 项目阶段 |
| `tasks` | 任务信息 |
| `agent_status_history` | 智能体状态历史 |

---

## 8. 开发环境

### 8.1 依赖版本

- Node.js: >= 18.0.0
- npm: >= 9.0.0

### 8.2 启动命令

```bash
# 后端
cd code/backend
npm install
npm run dev

# 前端
cd code/frontend
npm install
npm run dev
```

---

## 9. 与 agents-dashboard 的对比

| 方面 | agents-dashboard | openclaw-monitor |
|------|------------------|------------------|
| 目标 | 生产级大规模系统 | 本地监控工具 |
| 数据库 | PostgreSQL + Redis + ClickHouse | SQLite |
| 前端 | Next.js + Ant Design | React + Tailwind |
| 后端 | Fastify + Prisma | Express + better-sqlite3 |
| 部署 | Kubernetes | 本地单机 |
| 复杂度 | 高 | 低 |

---

**文档版本**: v1.0  
**创建时间**: 2026-03-23  
**维护者**: 智能体编排者
