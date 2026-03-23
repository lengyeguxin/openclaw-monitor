# OpenClaw Monitor 系统架构设计

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | OpenClaw Monitor 系统架构设计 |
| 版本 | v1.0 |
| 创建日期 | 2026-03-23 |
| 维护者 | 智能体编排者 |
| 项目路径 | `/home/my/.openclaw/ai-project/openclaw-monitor/` |

---

## 1. 系统整体架构

### 1.1 架构概览

OpenClaw Monitor 采用经典的三层架构：前端层、后端层、数据层。

**架构特点**：
| 特点 | 说明 |
|------|------|
| **分层架构** | 清晰的前端-后端-数据三层分离 |
| **轻量级** | 无复杂中间件，单文件数据库 |
| **本地优先** | 专为本地部署设计，零配置启动 |
| **模块化** | 各功能模块独立，易于扩展 |

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React 18 + Vite + Tailwind CSS | 轻量、快速开发 |
| 后端 | Node.js + Express | 简单、成熟 |
| 数据库 | SQLite | 零配置、本地存储 |
| 状态更新 | HTTP API + 轮询 | 智能体调用API更新状态 |

---

## 2. 前后端分层架构

### 2.1 前端架构

前端采用组件化架构，分为页面层、组件层、数据层和基础设施层。

**页面层（Pages）**：
- Dashboard（仪表盘）- 系统概览
- Agents（智能体页）- 智能体管理
- Projects（项目页）- 项目管理
- Tasks（任务页）- 任务管理

**组件层（Components）**：
- Layout（布局组件）- 页面整体布局
- Table（表格组件）- 数据展示
- Modal（弹窗组件）- 交互弹窗
- Card（卡片组件）- 信息卡片
- Form（表单组件）- 数据输入
- Button（按钮组件）- 操作按钮
- Badge（徽章组件）- 状态标识
- Progress（进度条）- 进度展示

**数据层（Data Layer）**：
- API Client - HTTP请求封装
- SWR - 数据获取与缓存
- Custom Hooks - 业务逻辑封装

**基础设施（Infrastructure）**：
- React 18 - UI框架
- React Router 6 - 路由管理
- Tailwind CSS - 样式框架
- Vite - 构建工具

### 2.2 后端架构

后端采用分层架构，分为路由层、服务层、数据访问层。

**路由层（Routes）**：
- `/api/v1/agents` - 智能体管理路由
- `/api/v1/projects` - 项目管理路由
- `/api/v1/stages` - 阶段管理路由
- `/api/v1/tasks` - 任务管理路由

**服务层（Services）**：
- AgentService - 智能体业务逻辑
- ProjectService - 项目业务逻辑
- StageService - 阶段业务逻辑
- TaskService - 任务业务逻辑

**数据访问层（Models）**：
- AgentModel - 智能体数据操作
- ProjectModel - 项目数据操作
- StageModel - 阶段数据操作
- TaskModel - 任务数据操作

**中间件（Middleware）**：
- CORS - 跨域支持
- Morgan - 请求日志
- Error Handler - 错误处理

---

## 3. 数据流向

### 3.1 智能体状态上报流程

```
智能体执行任务
    │
    ▼
调用 API: POST /api/v1/agents/:id/status-report
    │
    ▼
后端接收请求 → 验证参数 → 更新数据库
    │
    ▼
返回响应给智能体
    │
    ▼
前端轮询获取最新状态
```

### 3.2 任务分配流程

```
用户在UI创建任务
    │
    ▼
前端调用: POST /api/v1/tasks
    │
    ▼
后端创建任务记录 → 返回任务ID
    │
    ▼
用户分配智能体到任务
    │
    ▼
前端调用: POST /api/v1/tasks/:id/assign
    │
    ▼
后端更新任务表 → 更新智能体状态
    │
    ▼
智能体通过API获取任务
```

### 3.3 项目进度计算流程

```
阶段状态变更
    │
    ▼
触发进度重新计算
    │
    ▼
计算各阶段权重（基于任务数）
    │
    ▼
汇总已完成阶段占比
    │
    ▼
更新项目进度字段
    │
    ▼
前端实时展示进度
```

---

## 4. 部署架构

### 4.1 单机部署架构

```
┌─────────────────────────────────────────────────────────┐
│                      本地机器                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              OpenClaw Monitor                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │    │
│  │  │   Frontend  │  │   Backend   │  │ SQLite  │ │    │
│  │  │   (Vite)    │  │  (Express)  │  │  (File) │ │    │
│  │  │   :3000     │  │    :3001    │  │         │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │         智能体目录 (180+ 智能体)                 │    │
│  │  /home/my/.openclaw/agency-agents/              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 目录结构

```
/home/my/.openclaw/ai-project/openclaw-monitor/
├── code/
│   ├── backend/              # 后端代码
│   │   ├── src/
│   │   │   ├── server.js     # 主入口
│   │   │   ├── routes/       # API路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   ├── models/       # 数据模型
│   │   │   └── middleware/   # 中间件
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

### 4.3 启动流程

```
1. 启动后端服务
   cd code/backend
   npm install
   npm run dev
   # 服务运行在 http://localhost:3001

2. 启动前端服务
   cd code/frontend
   npm install
   npm run dev
   # 服务运行在 http://localhost:3000

3. 访问系统
   打开浏览器访问 http://localhost:3000
```

### 4.4 环境配置

**后端环境变量（.env）**：
```
PORT=3001
NODE_ENV=development
DB_PATH=../../data/monitor.db
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

**前端配置**：
```javascript
// src/config.js
export const API_BASE_URL = 'http://localhost:3001/api/v1';
export const POLLING_INTERVAL = 30000; // 30秒轮询
```

---

## 5. 模块交互关系

### 5.1 核心模块依赖图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │────▶│   Task      │◀────│   Project   │
│   Module    │     │   Module    │     │   Module    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       └───────────▶│   Stage     │◀───────────┘
                    │   Module    │
                    └─────────────┘
```

### 5.2 模块职责

| 模块 | 职责 | 核心功能 |
|------|------|----------|
| Agent | 智能体管理 | 状态监控、批量导入、历史查询 |
| Project | 项目管理 | CRUD、进度计算、阶段管理 |
| Stage | 阶段管理 | 状态流转、依赖管理、任务统计 |
| Task | 任务管理 | 分配跟踪、进度上报、依赖管理 |

### 5.3 模块间通信

- **同步调用**：模块间通过 Service 层直接调用
- **状态变更**：通过数据库触发器或应用层事件
- **数据一致性**：事务保证关键操作的原子性

---

## 6. 扩展性设计

### 6.1 水平扩展

当前架构为单机设计，如需扩展可考虑：
- 数据库迁移到 PostgreSQL
- 引入 Redis 缓存层
- 后端服务容器化部署

### 6.2 功能扩展

- **插件系统**：支持自定义智能体适配器
- **Webhook**：支持外部系统通知
- **API 版本**：预留 v2 API 路径

---

## 7. 安全设计

### 7.1 本地部署安全

- 仅监听本地地址（127.0.0.1）
- 数据库文件权限控制（600）
- 无外部网络暴露

### 7.2 API 安全

- 输入参数校验
- SQL 注入防护（参数化查询）
- CORS 限制（仅允许前端域名）

---

## 8. 监控与日志

### 8.1 日志记录

- 请求日志（Morgan）
- 错误日志（Winston）
- 操作审计日志

### 8.2 性能监控

- API 响应时间统计
- 数据库查询性能
- 前端页面加载时间

---

**文档版本**: v1.0  
**创建时间**: 2026-03-23  
**维护者**: 智能体编排者
