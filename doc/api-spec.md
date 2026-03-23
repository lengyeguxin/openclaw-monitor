# OpenClaw Monitor API 规范

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | OpenClaw Monitor API 规范 |
| 版本 | v1.0 |
| 创建日期 | 2026-03-23 |
| 维护者 | 智能体编排者 |
| 基础路径 | `/api/v1` |

---

## 1. 通用规范

### 1.1 请求规范

**基础URL**：`http://localhost:3001/api/v1`

**请求头**：
```
Content-Type: application/json
Accept: application/json
```

### 1.2 响应格式

**成功响应**：
```json
{
  "code": 0,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**：
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

### 1.3 分页参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码，从1开始 |
| limit | number | 否 | 20 | 每页条数，最大100 |

**分页响应**：
```json
{
  "code": 0,
  "data": {
    "list": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 1.4 错误码定义

| 错误码 | 类型 | 说明 |
|--------|------|------|
| 0 | Success | 成功 |
| 40000 | BadRequest | 请求参数错误 |
| 40001 | ValidationError | 参数校验失败 |
| 40002 | NotFound | 资源不存在 |
| 40003 | AlreadyExists | 资源已存在 |
| 40004 | InvalidState | 状态不允许 |
| 40100 | Unauthorized | 未授权 |
| 40300 | Forbidden | 禁止访问 |
| 50000 | InternalError | 服务器内部错误 |
| 50001 | DatabaseError | 数据库错误 |

---

## 2. 智能体管理 API

### 2.1 获取智能体列表

**请求**：`GET /api/v1/agents`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：idle/running/error/offline |
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 名称/描述搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应示例**：
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
        "current_task_id": null,
        "created_at": "2026-03-23T10:00:00Z",
        "updated_at": "2026-03-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 180,
      "total_pages": 9
    }
  }
}
```

### 2.2 新增智能体

**请求**：`POST /api/v1/agents`

**请求体**：
```json
{
  "name": "智能体名称",
  "description": "智能体描述",
  "category": "product",
  "capabilities": ["analysis", "documentation"],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**字段说明**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 智能体名称，2-50字符 |
| description | string | 否 | 智能体描述，最大500字符 |
| category | string | 否 | 分类：product/engineering/design/test |
| capabilities | array | 否 | 能力标签列表 |
| config | object | 否 | 配置信息 |

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "id": "agent_xxx",
    "name": "智能体名称",
    "status": "idle",
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 2.3 批量导入智能体

**请求**：`POST /api/v1/agents/batch-import`

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

**响应示例**：
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

### 2.4 获取智能体详情

**请求**：`GET /api/v1/agents/:id`

**响应示例**：
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
    "config": {
      "model": "gpt-4",
      "temperature": 0.7
    },
    "current_task_id": null,
    "task_history": [],
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 2.5 更新智能体状态

**请求**：`PATCH /api/v1/agents/:id/status`

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

**响应示例**：
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

### 2.6 智能体状态上报

**请求**：`POST /api/v1/agents/:id/status-report`

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

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "received": true,
    "recorded_at": "2026-03-23T10:00:01Z"
  }
}
```

---

## 3. 项目管理 API

### 3.1 获取项目列表

**请求**：`GET /api/v1/projects`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：draft/active/completed/archived |
| keyword | string | 否 | 项目名称搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应示例**：
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
        "task_count": 20,
        "completed_task_count": 9,
        "created_at": "2026-03-20T10:00:00Z",
        "updated_at": "2026-03-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "total_pages": 1
    }
  }
}
```

### 3.2 新增项目

**请求**：`POST /api/v1/projects`

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
    },
    {
      "name": "开发实现",
      "order": 3,
      "description": "编写代码"
    }
  ],
  "metadata": {}
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "id": "proj_xxx",
    "name": "项目名称",
    "status": "draft",
    "current_stage": null,
    "progress": 0,
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 3.3 获取项目详情

**请求**：`GET /api/v1/projects/:id`

**响应示例**：
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
    "metadata": {},
    "created_at": "2026-03-20T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 3.4 更新项目

**请求**：`PUT /api/v1/projects/:id`

**请求体**：
```json
{
  "name": "新名称",
  "description": "新描述",
  "status": "active",
  "metadata": {}
}
```

**响应示例**：
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

### 3.5 删除项目

**请求**：`DELETE /api/v1/projects/:id`

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "deleted": true
  }
}
```

---

## 4. 阶段管理 API

### 4.1 获取阶段列表

**请求**：`GET /api/v1/projects/:project_id/stages`

**响应示例**：
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
        "created_at": "2026-03-20T10:00:00Z",
        "updated_at": "2026-03-22T10:00:00Z"
      }
    ]
  }
}
```

### 4.2 新增阶段

**请求**：`POST /api/v1/projects/:project_id/stages`

**请求体**：
```json
{
  "name": "阶段名称",
  "order": 3,
  "description": "阶段描述",
  "prerequisites": ["stage_001"]
}
```

**响应示例**：
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

### 4.3 更新阶段

**请求**：`PUT /api/v1/stages/:id`

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

**响应示例**：
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

## 5. 任务管理 API

### 5.1 获取任务列表

**请求**：`GET /api/v1/tasks`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | string | 否 | 项目ID筛选 |
| stage_id | string | 否 | 阶段ID筛选 |
| status | string | 否 | 状态筛选：pending/running/completed/failed/cancelled |
| agent_id | string | 否 | 分配智能体筛选 |
| keyword | string | 否 | 任务名称搜索 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |

**响应示例**：
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
      "total": 50,
      "total_pages": 3
    }
  }
}
```

### 5.2 新增任务

**请求**：`POST /api/v1/tasks`

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

**响应示例**：
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

### 5.3 获取任务详情

**请求**：`GET /api/v1/tasks/:id`

**响应示例**：
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
    "dependencies": [],
    "started_at": "2026-03-23T09:00:00Z",
    "completed_at": "2026-03-23T10:00:00Z",
    "created_at": "2026-03-23T08:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 5.4 更新任务

**请求**：`PUT /api/v1/tasks/:id`

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

**响应示例**：
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

### 5.5 分配智能体到任务

**请求**：`POST /api/v1/tasks/:id/assign`

**请求体**：
```json
{
  "agent_ids": ["agent_001", "agent_002"],
  "assignment_type": "primary",
  "notify_agents": true
}
```

**分配类型枚举**：`primary` | `secondary` | `observer`

**响应示例**：
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
      }
    ],
    "updated_at": "2026-03-23T10:00:00Z"
  }
}
```

### 5.6 移除智能体分配

**请求**：`DELETE /api/v1/tasks/:id/agents/:agent_id`

**响应示例**：
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

### 5.7 任务进度上报

**请求**：`POST /api/v1/tasks/:id/progress-report`

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

**响应示例**：
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

## 6. 接口调用示例

### 6.1 完整业务流程示例

**场景**：创建项目 → 添加阶段 → 创建任务 → 分配智能体 → 智能体上报进度

**Step 1: 创建项目**
```bash
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新产品开发",
    "description": "开发新一代智能体监控系统",
    "stages": [
      {"name": "需求分析", "order": 1, "description": "分析需求"},
      {"name": "系统设计", "order": 2, "description": "设计架构"},
      {"name": "开发实现", "order": 3, "description": "编写代码"}
    ]
  }'
```

**Step 2: 创建任务**
```bash
curl -X POST http://localhost:3001/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_xxx",
    "stage_id": "stage_xxx",
    "name": "编写API文档",
    "description": "编写RESTful API规范",
    "priority": "high",
    "estimated_hours": 8
  }'
```

**Step 3: 分配智能体**
```bash
curl -X POST http://localhost:3001/api/v1/tasks/task_xxx/assign \
  -H "Content-Type: application/json" \
  -d '{
    "agent_ids": ["agent_001"],
    "assignment_type": "primary"
  }'
```

**Step 4: 智能体上报状态**
```bash
curl -X POST http://localhost:3001/api/v1/agents/agent_001/status-report \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running",
    "current_task_id": "task_xxx",
    "progress": {"percent": 50},
    "timestamp": "2026-03-23T10:00:00Z"
  }'
```

**Step 5: 任务进度上报**
```bash
curl -X POST http://localhost:3001/api/v1/tasks/task_xxx/progress-report \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_001",
    "progress": 100,
    "message": "任务完成"
  }'
```

---

## 7. API 概览表

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
| `/api/v1/projects/:id` | DELETE | 删除项目 |

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

---

**文档版本**: v1.0  
**创建时间**: 2026-03-23  
**维护者**: 智能体编排者