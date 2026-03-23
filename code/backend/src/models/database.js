const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('✓ Database connected and foreign keys enabled');
          resolve(this.db);
        });
      });
    });
  }

  async initializeSchema() {
    const tables = [
      // agents
      `CREATE TABLE IF NOT EXISTS agents (
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
      )`,
      // projects
      `CREATE TABLE IF NOT EXISTS projects (
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
      )`,
      // stages
      `CREATE TABLE IF NOT EXISTS stages (
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
      )`,
      // tasks
      `CREATE TABLE IF NOT EXISTS tasks (
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
      )`,
      // task_agents
      `CREATE TABLE IF NOT EXISTS task_agents (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        assignment_type TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'observer')),
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        UNIQUE(task_id, agent_id)
      )`,
      // agent_status_history
      `CREATE TABLE IF NOT EXISTS agent_status_history (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        status TEXT NOT NULL,
        task_id TEXT,
        message TEXT,
        metadata TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)',
      'CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category)',
      'CREATE INDEX IF NOT EXISTS idx_agents_current_task ON agents(current_task_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage_id)',
      'CREATE INDEX IF NOT EXISTS idx_stages_project ON stages(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_stages_status ON stages(status)',
      'CREATE INDEX IF NOT EXISTS idx_stages_order ON stages(project_id, "order")',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_stage_status ON tasks(stage_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_task_agents_task ON task_agents(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_task_agents_agent ON task_agents(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_history_agent ON agent_status_history(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_history_created ON agent_status_history(created_at)'
    ];

    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS update_agents_timestamp 
      AFTER UPDATE ON agents
      BEGIN
          UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`,
      `CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
      AFTER UPDATE ON projects
      BEGIN
          UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`,
      `CREATE TRIGGER IF NOT EXISTS update_stages_timestamp 
      AFTER UPDATE ON stages
      BEGIN
          UPDATE stages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`,
      `CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
      AFTER UPDATE ON tasks
      BEGIN
          UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let errors = [];
        
        // Create tables
        tables.forEach(sql => {
          this.db.run(sql, (err) => { if (err) errors.push(err); });
        });
        
        // Create indexes
        indexes.forEach(sql => {
          this.db.run(sql, (err) => { if (err) errors.push(err); });
        });
        
        // Create triggers
        triggers.forEach(sql => {
          this.db.run(sql, (err) => { if (err) errors.push(err); });
        });

        if (errors.length > 0) {
          console.error('Schema initialization errors:', errors);
          reject(errors[0]);
        } else {
          console.log('✓ Database schema initialized');
          resolve();
        }
      });
    });
  }

  async loadInitialData() {
    const statements = [
      `INSERT OR IGNORE INTO agents (id, name, description, category, status, capabilities) VALUES ('agent_product_001', '产品经理', '负责产品规划和需求分析', 'product', 'idle', '["planning", "analysis"]')`,
      `INSERT OR IGNORE INTO agents (id, name, description, category, status, capabilities) VALUES ('agent_engineering_001', '后端架构师', '负责后端系统设计和开发', 'engineering', 'idle', '["architecture", "backend"]')`,
      `INSERT OR IGNORE INTO agents (id, name, description, category, status, capabilities) VALUES ('agent_engineering_002', '前端开发者', '负责前端界面开发', 'engineering', 'idle', '["frontend", "ui"]')`,
      `INSERT OR IGNORE INTO agents (id, name, description, category, status, capabilities) VALUES ('agent_design_001', 'UI设计师', '负责界面视觉设计', 'design', 'idle', '["ui", "visual"]')`,
      `INSERT OR IGNORE INTO agents (id, name, description, category, status, capabilities) VALUES ('agent_test_001', '测试工程师', '负责系统测试', 'test', 'idle', '["testing", "qa"]')`,
      `INSERT OR IGNORE INTO projects (id, name, description, status, progress) VALUES ('proj_001', 'OpenClaw Monitor', '智能体监控系统', 'active', 45)`,
      `INSERT OR IGNORE INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES ('stage_001', 'proj_001', '需求分析', 1, '分析项目需求，编写需求文档', 'completed', 5, 5)`,
      `INSERT OR IGNORE INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES ('stage_002', 'proj_001', '系统设计', 2, '设计系统架构、API和数据库', 'completed', 3, 3)`,
      `INSERT OR IGNORE INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES ('stage_003', 'proj_001', '开发实现', 3, '编写前后端代码', 'active', 10, 2)`,
      `INSERT OR IGNORE INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES ('stage_004', 'proj_001', '系统测试', 4, '执行测试，编写测试报告', 'pending', 5, 0)`,
      `INSERT OR IGNORE INTO stages (id, project_id, name, "order", description, status, task_count, completed_task_count) VALUES ('stage_005', 'proj_001', '部署上线', 5, '部署到生产环境', 'pending', 2, 0)`,
      `UPDATE projects SET current_stage_id = 'stage_003' WHERE id = 'proj_001'`
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let i = 0;
        const next = () => {
          if (i >= statements.length) {
            console.log('✓ Initial data loaded');
            resolve();
            return;
          }
          this.db.run(statements[i], (err) => {
            if (err) {
              console.error('Error loading initial data:', statements[i], err);
              reject(err);
              return;
            }
            i++;
            next();
          });
        };
        next();
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(resolve);
      } else {
        resolve();
      }
    });
  }

  getDb() {
    return this.db;
  }
}

module.exports = Database;
