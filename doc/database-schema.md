# OpenClaw Monitor 数据库设计

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | OpenClaw Monitor 数据库设计 |
| 版本 | v1.0 |
| 创建日期 | 2026-03-23 |
| 维护者 | 智能体编排者 |
| 数据库 | SQLite 3.35+ |

---

## 1. 数据库概述

### 1.1 设计原则

- **单文件存储**：使用 SQLite 单文件数据库，便于备份和迁移
- **外键约束**：启用外键约束保证数据一致性
- **时间戳**：所有表包含 created_at 和 updated_at 字段
- **软删除**：使用 status 字段实现逻辑删除

### 1.2 数据库文件位置

```
/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db
```

### 1.3 实体关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   agents    │       │  projects   │       │   stages    │
│  (智能体)    │◄──────│   (项目)    │◄──────│   (阶段)    │
└──────┬──────┘       └─────────────┘       └──────┬──────┘
       │                                            │
       │                                            │
       │       ┌─────────────┐                    │
       └──────►│    tasks    │◄───────────────────┘
               │   (任务)    │
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │task_agents  │
               │(任务智能体) │
               └─────────────┘

┌─────────────┐       ┌─────────────────────┐
│   tasks     │◄──────│agent_status_history │
│  (任务)      │       │  (智能体状态历史)    │
└─────────────┘       └─────────────────────┘
```

---

## 2. 数据表设计

### 2.1 智能体表 (agents)

存储智能体基本信息和状态。

```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error', 'offline')),
    capabilities TEXT,  -- JSON array
    config TEXT,        -- JSON object
    current_task_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_current_task ON agents(current_task_id);
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 智能体唯一标识 |
| name | TEXT | NOT NULL | 智能体名称 |
| description | TEXT | - | 智能体描述 |
| category | TEXT | - | 分类：product/engineering/design/test |
| status | TEXT | NOT NULL, CHECK | 状态：idle/running/error/offline |
| capabilities | TEXT | - | JSON数组，能力标签 |
| config | TEXT | - | JSON对象，配置信息 |
| current_task_id | TEXT | FOREIGN KEY | 当前执行任务ID |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.2 项目表 (projects)

存储项目基本信息和进度。

```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    current_stage_id TEXT,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    metadata TEXT,  -- JSON object
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_stage_id) REFERENCES stages(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_current_stage ON projects(current_stage_id);
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 项目唯一标识 |
| name | TEXT | NOT NULL | 项目名称 |
| description | TEXT | - | 项目描述 |
| status | TEXT | NOT NULL, CHECK | 状态：draft/active/completed/archived |
| current_stage_id | TEXT | FOREIGN KEY | 当前阶段ID |
| progress | INTEGER | NOT NULL, CHECK | 进度百分比，0-100 |
| metadata | TEXT | - | JSON对象，扩展元数据 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.3 阶段表 (stages)

存储项目的阶段信息。

```sql
CREATE TABLE stages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'blocked')),
    prerequisites TEXT,  -- JSON array of stage IDs
    task_count INTEGER NOT NULL DEFAULT 0,
    completed_task_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_stages_project ON stages(project_id);
CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_stages_order ON stages(project_id, "order");
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 阶段唯一标识 |
| project_id | TEXT | NOT NULL, FOREIGN KEY | 所属项目ID |
| name | TEXT | NOT NULL | 阶段名称 |
| order | INTEGER | NOT NULL | 阶段顺序 |
| description | TEXT | - | 阶段描述 |
| status | TEXT | NOT NULL, CHECK | 状态：pending/active/completed/blocked |
| prerequisites | TEXT | - | JSON数组，前置阶段ID列表 |
| task_count | INTEGER | NOT NULL | 任务总数 |
| completed_task_count | INTEGER | NOT NULL | 已完成任务数 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.4 任务表 (tasks)

存储任务详细信息。

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_hours REAL,
    actual_hours REAL,
    dependencies TEXT,  -- JSON array of task IDs
    started_at DATETIME,
    completed_at DATETIME,
    metadata TEXT,  -- JSON object
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_stage ON tasks(stage_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_stage_status ON tasks(stage_id, status);
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 任务唯一标识 |
| project_id | TEXT | NOT NULL, FOREIGN KEY | 所属项目ID |
| stage_id | TEXT | NOT NULL, FOREIGN KEY | 所属阶段ID |
| name | TEXT | NOT NULL | 任务名称 |
| description | TEXT | - | 任务描述 |
| status | TEXT | NOT NULL, CHECK | 状态：pending/running/completed/failed/cancelled |
| priority | TEXT | NOT NULL, CHECK | 优先级：low/medium/high/urgent |
| progress | INTEGER | NOT NULL, CHECK | 进度百分比，0-100 |
| estimated_hours | REAL | - | 预估工时 |
| actual_hours | REAL | - | 实际工时 |
| dependencies | TEXT | - | JSON数组，依赖任务ID列表 |
| started_at | DATETIME | - | 开始时间 |
| completed_at | DATETIME | - | 完成时间 |
| metadata | TEXT | - | JSON对象，扩展元数据 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.5 任务智能体关联表 (task_agents)

存储任务与智能体的多对多关系。

```sql
CREATE TABLE task_agents (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'observer')),
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE(task_id, agent_id)
);

-- 索引
CREATE INDEX idx_task_agents_task ON task_agents(task_id);
CREATE INDEX idx_task_agents_agent ON task_agents(agent_id);
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 记录唯一标识 |
| task_id | TEXT | NOT NULL, FOREIGN KEY | 任务ID |
| agent_id | TEXT | NOT NULL, FOREIGN KEY | 智能体ID |
| assignment_type | TEXT | NOT NULL, CHECK | 分配类型：primary/secondary/observer |
| assigned_at | DATETIME | NOT NULL | 分配时间 |

### 2.6 智能体状态历史表 (agent_status_history)

存储智能体状态变更历史。

```sql
CREATE TABLE agent_status_history (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    task_id TEXT,
    message TEXT,
    metadata TEXT,  -- JSON object
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_agent_history_agent ON agent_status_history(agent_id);
CREATE INDEX idx_agent_history_created ON agent_status_history(created_at);
```

**字段说明**：
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 记录唯一标识 |
| agent_id | TEXT | NOT NULL, FOREIGN KEY | 智能体ID |
| status | TEXT | NOT NULL | 状态值 |
| task_id | TEXT | FOREIGN KEY | 关联任务ID |
| message | TEXT | - | 状态说明 |
| metadata | TEXT | - | JSON对象，扩展信息 |
| created_at | DATETIME | NOT NULL | 记录时间 |

---

## 3. 完整建表语句

```sql
-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================
-- 1. 智能体表
-- ============================================
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error', 'offline')),
    capabilities TEXT,
    config TEXT,
    current_task_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- ============================================
-- 2. 项目表
-- ============================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    current_stage_id TEXT,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    metadata TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_stage_id) REFERENCES stages(id) ON DELETE SET NULL
);

-- ============================================
-- 3. 阶段表
-- ============================================
CREATE TABLE stages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'blocked')),
    prerequisites TEXT,
    task_count INTEGER NOT NULL DEFAULT 0,
    completed_task_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================
-- 4. 任务表
-- ============================================
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_hours REAL,
    actual_hours REAL,
    dependencies TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    metadata TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
);

-- ============================================
-- 5. 任务智能体关联表
-- ============================================
CREATE TABLE task_agents (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'observer')),
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE(task_id, agent_id)
);

-- ============================================
-- 6. 智能体状态历史表
-- ============================================
CREATE TABLE agent_status_history (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    task_id TEXT,
    message TEXT,
    metadata TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- ============================================
-- 索引创建
-- ============================================

-- 智能体表索引
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_current_task ON agents(current_task_id);

-- 项目表索引
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_current_stage ON projects(current_stage_id);

-- 阶段表索引
CREATE INDEX idx_stages_project ON stages(project_id);
CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_stages_order ON stages(project_id, "order");

-- 任务表索引
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_stage ON tasks(stage_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_stage_status ON tasks(stage_id, status);

-- 任务智能体关联表索引
CREATE INDEX idx_task_agents_task ON task_agents(task_id);
CREATE INDEX idx_task_agents_agent ON task_agents(agent_id);

-- 智能体状态历史表索引
CREATE INDEX idx_agent_history_agent ON agent_status_history(agent_id);
CREATE INDEX idx_agent_history_created ON agent_status_history(created_at);
```

---

## 4. 索引设计

### 4.1 索引列表

| 索引名 | 表名 | 字段 | 用途 |
|--------|------|------|------|
| idx_agents_status | agents | status | 按状态筛选智能体 |
| idx_agents_category | agents | category | 按分类筛选智能体 |
| idx_agents_current_task | agents | current_task_id | 查询智能体当前任务 |
| idx_projects_status | projects | status | 按状态筛选项目 |
| idx_projects_current_stage | projects | current_stage_id | 查询项目当前阶段 |
| idx_stages_project | stages | project_id | 查询项目的所有阶段 |
| idx_stages_status | stages | status | 按状态筛选阶段 |
| idx_stages_order | stages | project_id, order | 按顺序获取阶段 |
| idx_tasks_project | tasks | project_id | 查询项目的所有任务 |
| idx_tasks_stage | tasks | stage_id | 查询阶段的所有任务 |
| idx_tasks_status | tasks | status | 按状态筛选任务 |
| idx_tasks_priority | tasks | priority | 按优先级筛选任务 |
| idx_tasks_stage_status | tasks | stage_id, status | 查询阶段的特定状态任务 |
| idx_task_agents_task | task_agents | task_id | 查询任务的智能体 |
| idx_task_agents_agent | task_agents | agent_id | 查询智能体的任务 |
| idx_agent_history_agent | agent_status_history | agent_id | 查询智能体历史 |
| idx_agent_history_created | agent_status_history | created_at | 按时间查询历史 |

### 4.2 索引设计原则

1. **外键索引**：所有外键字段都创建索引，加速关联查询
2. **状态索引**：经常按状态筛选的字段创建索引
3. **复合索引**：多条件查询场景创建复合索引
4. **避免过度索引**：写入频繁的表控制索引数量

---

## 5. 初始化数据

### 5.1 智能体分类数据

```sql
-- 插入示例智能体分类（用于前端筛选）
INSERT INTO agents (id, name, description, category, status, capabilities) VALUES
('agent_product_001', '产品经理', '负责产品规划和需求分析', 'product', 'idle', '["planning", "analysis"]'),
('agent_engineering_001', '后端架构师', '负责后端系统设计和开发', 'engineering', 'idle', '["architecture", "backend"]'),
('agent_engineering_002', '前端开发者', '负责前端界面开发', 'engineering', 'idle', '["frontend", "ui"]'),
('agent_design_001', 'UI设计师', '负责界面视觉设计', 'design', 'idle', '["ui", "visual"]'),
('agent_test_001', '测试工程师', '负责系统测试', 'test', 'idle', '["testing", "qa"]');
```

### 5.2 示例项目数据

```sql
-- 插入示例项目
INSERT INTO projects (id, name, description, status, progress) VALUES
('proj_001', 'OpenClaw Monitor', '智能体监控系统', 'active', 45);

-- 插入项目阶段
INSERT INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES
('stage_001', 'proj_001', '需求分析', 1, '分析项目需求，编写需求文档', 'completed', 5, 5),
('stage_002', 'proj_001', '系统设计', 2, '设计系统架构、API和数据库', 'completed', 3, 3),
('stage_003', 'proj_001', '开发实现', 3, '编写前后端代码', 'active', 10, 2),
('stage_004', 'proj_001', '系统测试', 4, '执行测试，编写测试报告', 'pending', 5, 0),
('stage_005', 'proj_001', '部署上线', 5, '部署到生产环境', 'pending', 2, 0);

-- 更新项目当前阶段
UPDATE projects SET current_stage_id = 'stage_003' WHERE id = 'proj_001';
```

### 5.3 示例任务数据

```sql
-- 插入示例任务
INSERT INTO tasks (id, project_id, stage_id, name, description, status, priority, progress, estimated_hours, actual_hours) VALUES
('task_001', 'proj_001', 'stage_001', '编写需求规格说明书', '编写详细的需求分析文档', 'completed', 'high', 100, 8, 6),
('task_002', 'proj_001', 'stage_001', '用户故事整理', '整理用户故事和验收标准', 'completed', 'medium', 100, 4, 4),
('task_003', 'proj_001', 'stage_002', '系统架构设计', '设计系统整体架构', 'completed', 'high', 100, 8, 8),
('task_004', 'proj_001', 'stage_002', 'API接口设计', '设计RESTful API接口', 'completed', 'high', 100, 6, 5),
('task_005', 'proj_001', 'stage_002', '数据库设计', '设计数据库表结构', 'completed', 'high', 100, 4, 4),
('task_006', 'proj_001', 'stage_003', '后端基础框架搭建', '搭建Express后端框架', 'completed', 'high', 100, 4, 3),
('task_007', 'proj_001', 'stage_003', '前端项目初始化', '初始化React项目', 'completed', 'medium', 100, 2, 2),
('task_008', 'proj_001', 'stage_003', '智能体管理API开发', '开发智能体CRUD接口', 'running', 'high', 60, 8, 5),
('task_009', 'proj_001', 'stage_003', '项目管理API开发', '开发项目CRUD接口', 'pending', 'high', 0, 6, 0),
('task_010', 'proj_001', 'stage_003', '前端页面开发', '开发前端页面组件', 'pending', 'medium', 0, 16, 0);

-- 分配智能体到任务
INSERT INTO task_agents (id, task_id, agent_id, assignment_type) VALUES
('ta_001', 'task_001', 'agent_product_001', 'primary'),
('ta_002', 'task_003', 'agent_engineering_001', 'primary'),
('ta_003', 'task_004', 'agent_engineering_001', 'primary'),
('ta_004', 'task_005', 'agent_engineering_001', 'primary'),
('ta_005', 'task_006', 'agent_engineering_001', 'primary'),
('ta_006', 'task_007', 'agent_engineering_002', 'primary'),
('ta_007', 'task_008', 'agent_engineering_001', 'primary'),
('ta_008', 'task_010', 'agent_engineering_002', 'primary');

-- 更新智能体当前任务
UPDATE agents SET current_task_id = 'task_008' WHERE id = 'agent_engineering_001';
UPDATE agents SET status = 'running' WHERE id = 'agent_engineering_001';
```

### 5.4 状态历史数据

```sql
-- 插入智能体状态历史
INSERT INTO agent_status_history (id, agent_id, status, task_id, message) VALUES
('hist_001', 'agent_engineering_001', 'running', 'task_008', '开始开发智能体管理API'),
('hist_002', 'agent_product_001', 'idle', NULL, '任务完成，恢复空闲'),
('hist_003', 'agent_engineering_001', 'idle', NULL, '项目初始化完成'),
('hist_004', 'agent_engineering_001', 'running', 'task_006', '开始后端框架搭建');
```

---

## 6. 数据库工具函数

### 6.1 更新时间戳触发器

```sql
-- 创建更新时间戳的触发器函数
CREATE TRIGGER IF NOT EXISTS update_agents_timestamp 
AFTER UPDATE ON agents
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_stages_timestamp 
AFTER UPDATE ON stages
BEGIN
    UPDATE stages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 6.2 项目进度更新函数

```sql
-- 计算项目进度的视图
CREATE VIEW project_progress AS
SELECT 
    p.id as project_id,
    COUNT(DISTINCT s.id) as total_stages,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_stages,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    CASE 
        WHEN COUNT(DISTINCT t.id) = 0 THEN 0
        ELSE ROUND(COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) * 100.0 / COUNT(DISTINCT t.id), 0)
    END as progress
FROM projects p
LEFT JOIN stages s ON s.project_id = p.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id;
```

---

## 7. 数据备份与恢复

### 7.1 备份命令

```bash
# SQLite 备份
sqlite3 /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db ".backup '/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor_backup.db'"

# 或导出为 SQL
sqlite3 /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db ".dump" > /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor_backup.sql
```

### 7.2 恢复命令

```bash
# 从备份文件恢复
sqlite3 /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db ".restore '/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor_backup.db'"

# 或从 SQL 文件恢复
sqlite3 /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db < /home/my/.openclaw/ai-project/openclaw-monitor/data/monitor_backup.sql
```

---

## 8. 性能优化建议

### 8.1 查询优化

1. **使用索引字段进行筛选**：优先使用有索引的字段（status、category等）
2. **避免全表扫描**：大数据量查询使用 LIMIT 分页
3. **合理使用 JOIN**：避免多层嵌套 JOIN

### 8.2 写入优化

1. **批量插入**：使用事务批量插入数据
2. **延迟索引更新**：大批量导入时先删除索引，导入完成后再重建

### 8.3 维护建议

1. **定期 VACUUM**：回收数据库空间
2. **定期 ANALYZE**：更新查询优化器统计信息
3. **监控慢查询**：记录执行时间超过 1 秒的查询

---

**文档版本**: v1.0  
**创建时间**: 2026-03-23  
**维护者**: 智能体编排者