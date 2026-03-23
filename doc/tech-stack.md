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

## 6. API 设计详述

### 6.1 智能体管理 API

#### 6.1.1 获取智能体列表
```
GET /api/v1/agents
```
**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：idle/running/error/offline |
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 名称/描述搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "agent_001",
        "name": "需求分析师",
        "description": "负责需求分析和文档编写",
        "category": "product",
        "status": "idle",
        "capabilities": ["analysis", "documentation"],
        "created_at": "2026-03-23T10:00:00Z",
        "updated_at": "2026-03-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### 6.1.2 新增智能体
```
POST /api/v1/agents
```
**请求体**：
```json
{
  "name": "智能体名称",
  "description": "智能体描述",
  "category": "分类",
  "capabilities": ["能力1", "能力2"],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "agent_xxx",
    "name": "智能体名称",
    "status": "idle",
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.1.3 批量导入智能体
```
POST /api/v1/agents/batch-import
```
**请求体**：
```json
{
  "source": "directory",
  "path": "/home/my/.openclaw/agency-agents",
  "options": {
    "recursive": true,
    "overwrite_existing": false
  }
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "imported": 150,
    "skipped": 10,
    "failed": 0,
    "details": [
      {
        "name": "需求分析师",
        "status": "success",
        "agent_id": "agent_001"
      }
    ]
  }
}
```

#### 6.1.4 更新智能体状态
```
PATCH /api/v1/agents/:id/status
```
**请求体**：
```json
{
  "status": "running",
  "task_id": "task_xxx",
  "message": "正在执行任务...",
  "metadata": {
    "progress": 50,
    "current_step": "分析需求"
  }
}
```

**状态枚举**：`idle` | `running` | `error` | `offline`

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "agent_001",
    "status": "running",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.1.5 获取智能体详情
```
GET /api/v1/agents/:id
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "agent_001",
    "name": "需求分析师",
    "description": "负责需求分析和文档编写",
    "category": "product",
    "status": "idle",
    "capabilities": ["analysis", "documentation"],
    "config": {},
    "task_history": [
      {
        "task_id": "task_001",
        "task_name": "XX项目需求分析",
        "status": "completed",
        "completed_at": "2026-03-22T10:00:00Z"
      }
    ],
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

---

### 6.2 项目管理 API

#### 6.2.1 获取项目列表
```
GET /api/v1/projects
```
**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：draft/active/completed/archived |
| keyword | string | 否 | 项目名称搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "proj_001",
        "name": "OpenClaw Monitor",
        "description": "智能体监控系统",
        "status": "active",
        "current_stage": "开发实现",
        "progress": 45,
        "created_at": "2026-03-20T10:00:00Z",
        "updated_at": "2026-03-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10
    }
  }
}
```

#### 6.2.2 新增项目
```
POST /api/v1/projects
```
**请求体**：
```json
{
  "name": "项目名称",
  "description": "项目描述",
  "stages": [
    {
      "name": "需求分析",
      "order": 1,
      "description": "分析项目需求"
    },
    {
      "name": "系统设计",
      "order": 2,
      "description": "设计系统架构"
    }
  ],
  "metadata": {}
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "proj_xxx",
    "name": "项目名称",
    "status": "draft",
    "current_stage": null,
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.2.3 更新项目
```
PUT /api/v1/projects/:id
```
**请求体**：
```json
{
  "name": "新名称",
  "description": "新描述",
  "status": "active",
  "metadata": {}
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "proj_001",
    "name": "新名称",
    "status": "active",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.2.4 获取项目详情
```
GET /api/v1/projects/:id
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "proj_001",
    "name": "OpenClaw Monitor",
    "description": "智能体监控系统",
    "status": "active",
    "current_stage": "开发实现",
    "progress": 45,
    "stages": [
      {
        "id": "stage_001",
        "name": "需求分析",
        "order": 1,
        "status": "completed",
        "task_count": 5,
        "completed_task_count": 5
      }
    ],
    "tasks": [
      {
        "id": "task_001",
        "name": "编写技术栈文档",
        "status": "completed",
        "assigned_agents": ["agent_001"]
      }
    ],
    "metadata": {},
    "created_at": "2026-03-20T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

---

### 6.3 阶段管理 API

#### 6.3.1 获取阶段列表
```
GET /api/v1/projects/:project_id/stages
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "stage_001",
        "project_id": "proj_001",
        "name": "需求分析",
        "order": 1,
        "description": "分析项目需求",
        "status": "completed",
        "task_count": 5,
        "completed_task_count": 5,
        "created_at": "2026-03-20T10:00:00Z"
      }
    ]
  }
}
```

#### 6.3.2 新增阶段
```
POST /api/v1/projects/:project_id/stages
```
**请求体**：
```json
{
  "name": "阶段名称",
  "order": 3,
  "description": "阶段描述",
  "prerequisites": ["stage_001"]
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "stage_xxx",
    "project_id": "proj_001",
    "name": "阶段名称",
    "order": 3,
    "status": "pending",
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.3.3 更新阶段
```
PUT /api/v1/stages/:id
```
**请求体**：
```json
{
  "name": "新名称",
  "order": 2,
  "description": "新描述",
  "status": "active"
}
```

**状态枚举**：`pending` | `active` | `completed` | `blocked`

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "stage_001",
    "name": "新名称",
    "status": "active",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

---

### 6.4 任务管理 API

#### 6.4.1 获取任务列表
```
GET /api/v1/tasks
```
**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | string | 否 | 项目ID筛选 |
| stage_id | string | 否 | 阶段ID筛选 |
| status | string | 否 | 状态筛选：pending/running/completed/failed/cancelled |
| agent_id | string | 否 | 分配智能体筛选 |
| keyword | string | 否 | 任务名称搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "task_001",
        "project_id": "proj_001",
        "stage_id": "stage_001",
        "name": "编写技术栈文档",
        "description": "编写详细的技术栈选型文档",
        "status": "completed",
        "priority": "high",
        "assigned_agents": [
          {
            "id": "agent_001",
            "name": "后端架构师",
            "status": "idle"
          }
        ],
        "progress": 100,
        "started_at": "2026-03-23T09:00:00Z",
        "completed_at": "2026-03-23T10:00:00Z",
        "created_at": "2026-03-23T08:00:00Z",
        "updated_at": "2026-03-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

#### 6.4.2 新增任务
```
POST /api/v1/tasks
```
**请求体**：
```json
{
  "project_id": "proj_001",
  "stage_id": "stage_001",
  "name": "任务名称",
  "description": "任务描述",
  "priority": "high",
  "estimated_hours": 8,
  "assigned_agent_ids": ["agent_001", "agent_002"],
  "dependencies": ["task_001"],
  "metadata": {}
}
```

**优先级枚举**：`low` | `medium` | `high` | `urgent`

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "task_xxx",
    "project_id": "proj_001",
    "stage_id": "stage_001",
    "name": "任务名称",
    "status": "pending",
    "priority": "high",
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.4.3 更新任务
```
PUT /api/v1/tasks/:id
```
**请求体**：
```json
{
  "name": "新名称",
  "description": "新描述",
  "status": "running",
  "priority": "medium",
  "progress": 50,
  "estimated_hours": 10,
  "actual_hours": 5,
  "metadata": {}
}
```

**状态枚举**：`pending` | `running` | `completed` | `failed` | `cancelled`

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "task_001",
    "name": "新名称",
    "status": "running",
    "progress": 50,
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.4.4 分配智能体到任务
```
POST /api/v1/tasks/:id/assign
```
**请求体**：
```json
{
  "agent_ids": ["agent_001", "agent_002"],
  "assignment_type": "primary",
  "notify_agents": true
}
```

**分配类型枚举**：`primary` | `secondary` | `observer`

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "task_001",
    "assigned_agents": [
      {
        "id": "agent_001",
        "name": "后端架构师",
        "assignment_type": "primary",
        "assigned_at": "2026-03-23T10:00:00Z"
      },
      {
        "id": "agent_002",
        "name": "前端开发者",
        "assignment_type": "secondary",
        "assigned_at": "2026-03-23T10:00:00Z"
      }
    ],
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.4.5 移除智能体分配
```
DELETE /api/v1/tasks/:id/agents/:agent_id
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "task_001",
    "removed_agent_id": "agent_002",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

#### 6.4.6 获取任务详情
```
GET /api/v1/tasks/:id
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "task_001",
    "project_id": "proj_001",
    "stage_id": "stage_001",
    "name": "编写技术栈文档",
    "description": "编写详细的技术栈选型文档",
    "status": "completed",
    "priority": "high",
    "progress": 100,
    "estimated_hours": 8,
    "actual_hours": 6,
    "assigned_agents": [
      {
        "id": "agent_001",
        "name": "后端架构师",
        "assignment_type": "primary",
        "status": "idle",
        "assigned_at": "2026-03-23T09:00:00Z"
      }
    ],
    "dependencies": [
      {
        "id": "task_000",
        "name": "项目初始化",
        "status": "completed"
      }
    ],
    "subtasks": [
      {
        "id": "subtask_001",
        "name": "调研技术方案",
        "status": "completed"
      }
    ],
    "logs": [
      {
        "id": "log_001",
        "type": "status_change",
        "from": "pending",
        "to": "running",
        "created_at": "2026-03-23T09:00:00Z"
      }
    ],
    "started_at": "2026-03-23T09:00:00Z",
    "completed_at": "2026-03-23T10:00:00Z",
    "created_at": "2026-03-23T08:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

---

### 6.5 状态更新 API（智能体上报）

#### 6.5.1 智能体状态上报
```
POST /api/v1/agents/:id/status-report
```
**请求体**：
```json
{
  "status": "running",
  "current_task_id": "task_001",
  "message": "正在分析需求...",
  "progress": {
    "percent": 45,
    "current_step": 3,
    "total_steps": 10,
    "step_name": "数据建模"
  },
  "metrics": {
    "cpu_usage": 45,
    "memory_usage": 60,
    "tokens_used": 1500
  },
  "timestamp": "2026-03-23T10:00:00Z"
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "received": true,
    "recorded_at": "2026-03-23T10:00:01Z"
  }
}
```

#### 6.5.2 任务进度上报
```
POST /api/v1/tasks/:id/progress-report
```
**请求体**：
```json
{
  "agent_id": "agent_001",
  "progress": 75,
  "message": "已完成核心模块开发",
  "output": {
    "files_created": ["src/api/agents.js", "src/models/agent.js"],
    "lines_of_code": 500
  },
  "timestamp": "2026-03-23T10:00:00Z"
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "received": true,
    "task_status": "running",
    "updated_at": "2026-03-23T10:00:01Z"
  }
}
```

---

### 6.6 通用响应格式

#### 成功响应
```json
{
  "code": 0,
  "data": { ... },
  "message": "操作成功"
}
```

#### 错误响应
```json
{
  "code": 40001,
  "error": {
    "type": "ValidationError",
    "message": "请求参数错误",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  }
}
```

#### 错误码定义
| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 40000 | 请求参数错误 |
| 40001 | 参数校验失败 |
| 40002 | 资源不存在 |
| 40003 | 资源已存在 |
| 40004 | 状态不允许 |
| 50000 | 服务器内部错误 |
| 50001 | 数据库错误 |

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

**文档版本**: v1.1  
**创建时间**: 2026-03-23  
**更新时间**: 2026-03-23  
**维护者**: 智能体编排者

---

## 附录：API 概览表

### 智能体管理 API
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/agents` | GET | 获取智能体列表 |
| `/api/v1/agents` | POST | 新增智能体 |
| `/api/v1/agents/batch-import` | POST | 批量导入智能体 |
| `/api/v1/agents/:id` | GET | 获取智能体详情 |
| `/api/v1/agents/:id/status` | PATCH | 更新智能体状态 |
| `/api/v1/agents/:id/status-report` | POST | 智能体状态上报 |

### 项目管理 API
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/projects` | GET | 获取项目列表 |
| `/api/v1/projects` | POST | 新增项目 |
| `/api/v1/projects/:id` | GET | 获取项目详情 |
| `/api/v1/projects/:id` | PUT | 更新项目 |

### 阶段管理 API
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/projects/:project_id/stages` | GET | 获取阶段列表 |
| `/api/v1/projects/:project_id/stages` | POST | 新增阶段 |
| `/api/v1/stages/:id` | PUT | 更新阶段 |

### 任务管理 API
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/tasks` | GET | 获取任务列表 |
| `/api/v1/tasks` | POST | 新增任务 |
| `/api/v1/tasks/:id` | GET | 获取任务详情 |
| `/api/v1/tasks/:id` | PUT | 更新任务 |
| `/api/v1/tasks/:id/assign` | POST | 分配智能体到任务 |
| `/api/v1/tasks/:id/agents/:agent_id` | DELETE | 移除智能体分配 |
| `/api/v1/tasks/:id/progress-report` | POST | 任务进度上报 |
