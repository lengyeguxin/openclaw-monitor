#!/usr/bin/env node
/**
 * Database Initialization Script for OpenClaw Monitor
 * 
 * This script:
 * 1. Scans the agency-agents directory for agent identities
 * 2. Creates all required database tables and indexes
 * 3. Imports agent data with proper categorization
 * 4. Creates sample project and task data for testing
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = '/home/my/.openclaw';
const AGENCY_DIR = path.join(BASE_DIR, 'agency-agents');
const PROJECT_DIR = '/home/my/.openclaw/ai-project/openclaw-monitor';
const DB_PATH = path.join(PROJECT_DIR, 'data', 'monitor.db');
const AGENTS_SCRIPT_DIR = path.join(PROJECT_DIR, 'code', 'backend', 'src', 'scripts');

// Ensure directories exist
[AGENTS_SCRIPT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Category classification function
function classifyAgent(agentId) {
  if (agentId.startsWith('product-')) return 'product';
  if (agentId.startsWith('engineering-')) return 'engineering';
  if (agentId.startsWith('design-')) return 'design';
  if (agentId.startsWith('testing-')) return 'test';
  if (agentId.startsWith('academic-')) return 'other';
  if (agentId.startsWith('agentic-')) return 'other';
  if (agentId.startsWith('accounts-')) return 'other';
  if (agentId.startsWith('automation-')) return 'other';
  if (agentId.startsWith('blender-')) return 'other';
  if (agentId.startsWith('blockchain-')) return 'other';
  if (agentId.startsWith('compliance-')) return 'other';
  if (agentId.startsWith('corporate-')) return 'other';
  if (agentId.startsWith('data-')) return 'other';
  if (agentId.startsWith('finance-')) return 'other';
  if (agentId.startsWith('game-')) return 'other';
  if (agentId.startsWith('gaokao-')) return 'other';
  if (agentId.startsWith('godot-')) return 'other';
  if (agentId.startsWith('government-')) return 'other';
  if (agentId.startsWith('healthcare-')) return 'other';
  if (agentId.startsWith('hr-')) return 'other';
  if (agentId.startsWith('identity-')) return 'other';
  if (agentId.startsWith('legal-')) return 'other';
  if (agentId.startsWith('level-')) return 'other';
  if (agentId.startsWith('lsp-')) return 'other';
  if (agentId.startsWith('macos-')) return 'other';
  if (agentId.startsWith('marketing-')) return 'other';
  if (agentId.startsWith('narrative-')) return 'other';
  if (agentId.startsWith('paid-')) return 'other';
  if (agentId.startsWith('project-')) return 'other';
  if (agentId.startsWith('prompt-')) return 'other';
  if (agentId.startsWith('report-')) return 'other';
  if (agentId.startsWith('roblox-')) return 'other';
  if (agentId.startsWith('sales-')) return 'other';
  if (agentId.startsWith('specialized-')) return 'other';
  if (agentId.startsWith('study-')) return 'other';
  if (agentId.startsWith('supply-')) return 'other';
  if (agentId.startsWith('support-')) return 'other';
  if (agentId.startsWith('technical-')) return 'other';
  if (agentId.startsWith('terminal-')) return 'other';
  if (agentId.startsWith('unity-')) return 'other';
  if (agentId.startsWith('unreal-')) return 'other';
  if (agentId.startsWith('visionos-')) return 'other';
  if (agentId.startsWith('xr-')) return 'other';
  if (agentId.startsWith('zk-')) return 'other';
  return 'other';
}

// Read agent identity from IDENTITY.md
function readAgentIdentity(agentId) {
  const identityPath = path.join(AGENCY_DIR, agentId, 'IDENTITY.md');
  
  if (!fs.existsSync(identityPath)) {
    return {
      name: agentId,
      description: 'No description available'
    };
  }
  
  try {
    const content = fs.readFileSync(identityPath, 'utf8');
    
    // Extract name from first line (after #)
    let name = agentId;
    const nameMatch = content.match(/^#\s+(.+)$/m);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
    
    // Extract description (first paragraph after title)
    let description = 'No description available';
    const descMatch = content.match(/^#\s+.+\s*\n\s*\n(.+?)(?=\n\n|\n#|$)/s);
    if (descMatch) {
      description = descMatch[1].trim().replace(/\n/g, ' ').substring(0, 500);
    }
    
    return { name, description };
  } catch (err) {
    return {
      name: agentId,
      description: 'Error reading identity file'
    };
  }
}

// Get all agents from agency-agents directory
function getAllAgents() {
  const entries = fs.readdirSync(AGENCY_DIR, { withFileTypes: true });
  
  const agents = entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const agentId = entry.name;
      const identity = readAgentIdentity(agentId);
      return {
        id: agentId,
        name: identity.name,
        description: identity.description,
        category: classifyAgent(agentId)
      };
    });
  
  return agents;
}

// Create database schema
async function createSchema(db) {
  const schema = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist (for re-runnable script)
DROP TABLE IF EXISTS agent_status_history;
DROP TABLE IF EXISTS task_agents;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS stages;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS agents;

-- ============================================
-- 1. 智能体表 (agents)
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
-- 2. 项目表 (projects)
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
-- 3. 阶段表 (stages)
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
-- 4. 任务表 (tasks)
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
-- 5. 任务智能体关联表 (task_agents)
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
-- 6. 智能体状态历史表 (agent_status_history)
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
`;

  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Insert agents into database
async function insertAgents(db, agents) {
  let count = 0;
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let i = 0;
      function insertNext() {
        if (i >= agents.length) {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              resolve(count);
            }
          });
          return;
        }
        
        const agent = agents[i];
        const capabilities = JSON.stringify(['general']);
        db.run(
          'INSERT INTO agents (id, name, description, category, status, capabilities) VALUES (?, ?, ?, ?, ?, ?)',
          [agent.id, agent.name, agent.description, agent.category, 'idle', capabilities],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              count++;
              i++;
              insertNext();
            }
          }
        );
      }
      
      insertNext();
    });
  });
}

// Insert sample project data
async function insertSampleData(db) {
  const projectId = 'proj_001';
  const stageIds = [
    { id: 'stage_001', name: '需求分析', order: 1, status: 'completed' },
    { id: 'stage_002', name: '系统设计', order: 2, status: 'completed' },
    { id: 'stage_003', name: '开发实现', order: 3, status: 'active' },
    { id: 'stage_004', name: '系统测试', order: 4, status: 'pending' },
    { id: 'stage_005', name: '部署上线', order: 5, status: 'pending' }
  ];
  
  const taskData = [
    { id: 'task_001', stageId: 'stage_001', name: '编写需求规格说明书', desc: '编写详细的需求分析文档', status: 'completed' },
    { id: 'task_002', stageId: 'stage_001', name: '用户故事整理', desc: '整理用户故事和验收标准', status: 'completed' },
    { id: 'task_003', stageId: 'stage_002', name: '系统架构设计', desc: '设计系统整体架构', status: 'completed' },
    { id: 'task_004', stageId: 'stage_002', name: 'API接口设计', desc: '设计RESTful API接口', status: 'completed' },
    { id: 'task_005', stageId: 'stage_002', name: '数据库设计', desc: '设计数据库表结构', status: 'completed' },
    { id: 'task_006', stageId: 'stage_003', name: '后端基础框架搭建', desc: '搭建Express后端框架', status: 'completed' },
    { id: 'task_007', stageId: 'stage_003', name: '前端项目初始化', desc: '初始化React项目', status: 'completed' },
    { id: 'task_008', stageId: 'stage_003', name: '智能体管理API开发', desc: '开发智能体CRUD接口', status: 'running' },
    { id: 'task_009', stageId: 'stage_003', name: '项目管理API开发', desc: '开发项目CRUD接口', status: 'pending' },
    { id: 'task_010', stageId: 'stage_003', name: '前端页面开发', desc: '开发前端页面组件', status: 'pending' }
  ];
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const ops = [];
      
      // Insert project
      ops.push((cb) => {
        db.run(
          'INSERT INTO projects (id, name, description, status, progress) VALUES (?, ?, ?, ?, ?)',
          [projectId, 'OpenClaw Monitor', '智能体监控系统', 'active', 45],
          cb
        );
      });
      
      // Insert stages
      stageIds.forEach(stage => {
        ops.push((cb) => {
          db.run(
            'INSERT INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              stage.id,
              projectId,
              stage.name,
              stage.order,
              stage.name + '阶段详细描述',
              stage.status,
              stage.id === 'stage_001' ? 5 : (stage.id === 'stage_002' ? 3 : (stage.id === 'stage_003' ? 10 : (stage.id === 'stage_004' ? 5 : 2))),
              stage.status === 'completed' ? (stage.id === 'stage_001' ? 5 : (stage.id === 'stage_002' ? 3 : 0)) : 0
            ],
            cb
          );
        });
      });
      
      // Update project current stage
      ops.push((cb) => {
        db.run(
          'UPDATE projects SET current_stage_id = ? WHERE id = ?',
          ['stage_003', projectId],
          cb
        );
      });
      
      // Insert tasks
      taskData.forEach(task => {
        ops.push((cb) => {
          db.run(
            'INSERT INTO tasks (id, project_id, stage_id, name, description, status, priority, progress, estimated_hours, actual_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              task.id,
              projectId,
              task.stageId,
              task.name,
              task.desc,
              task.status,
              'medium',
              task.status === 'completed' ? 100 : (task.status === 'running' ? 60 : 0),
              task.status === 'completed' ? 6 : (task.status === 'running' ? 8 : 5),
              task.status === 'completed' ? 4 : (task.status === 'running' ? 3 : 0)
            ],
            cb
          );
        });
      });
      
      // Execute all operations sequentially
      let current = 0;
      function executeNext(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        if (current >= ops.length) {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              resolve(stageIds.length + taskData.length);
            }
          });
          return;
        }
        
        ops[current](executeNext);
        current++;
      }
      
      executeNext();
    });
  });
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('OpenClaw Monitor Database Initialization');
  console.log('========================================\n');
  
  // Read all agents
  console.log('🔍 Scanning agents directory...');
  const agents = getAllAgents();
  console.log(`   Found ${agents.length} agents\n`);
  
  // Log agents by category
  const categories = {};
  agents.forEach(agent => {
    if (!categories[agent.category]) categories[agent.category] = [];
    categories[agent.category].push(agent);
  });
  
  console.log('📈 Agent categories:');
  Object.entries(categories).forEach(([cat, agents]) => {
    console.log(`   ${cat}: ${agents.length} agents`);
  });
  console.log();
  
  // Remove existing database file if exists (clean slate)
  if (fs.existsSync(DB_PATH)) {
    console.log(`🗑️  Removing existing database: ${DB_PATH}`);
    fs.unlinkSync(DB_PATH);
  }
  
  // Create database
  console.log('🔨 Creating database schema...');
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    await createSchema(db);
    console.log('   ✓ Tables created successfully\n');
    
    // Insert agents
    console.log(`💾 Inserting ${agents.length} agents...`);
    const agentCount = await insertAgents(db, agents);
    console.log(`   ✓ ${agentCount} agents inserted\n`);
    
    // Insert sample data
    console.log('🎲 Inserting sample project data...');
    const itemsInserted = await insertSampleData(db);
    console.log(`   ✓ ${itemsInserted} sample items inserted\n`);
    
    console.log('========================================');
    console.log('✅ Database initialization completed!');
    console.log('========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Database file: ${DB_PATH}`);
    console.log(`   - Agents imported: ${agentCount}`);
    console.log(`   - Categories: ${Object.keys(categories).length}`);
    console.log(`   - Sample project: 1`);
    console.log(`   - Sample stages: 5`);
    console.log(`   - Sample tasks: 10`);
    console.log(`\n📁 Files created:`);
    console.log(`   - ${DB_PATH}`);
    console.log(`   - ${path.join(AGENTS_SCRIPT_DIR, 'init-db.js')}`);
    
    // List all tables
    console.log(`\n📋 Tables created:`);
    const tables = await new Promise((resolve, reject) => {
      db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    tables.forEach(row => console.log(`   - ${row.name}`));
    
    // Close connection properly
    db.close((err) => {
      if (err) console.log('Close warning:', err.message);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }
}

main();
