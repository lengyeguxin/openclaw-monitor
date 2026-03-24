const BaseModel = require('./baseModel');

class TaskModel extends BaseModel {
  constructor(db) {
    super(db, 'tasks');
  }

  async findByIdWithDetails(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          t.*,
          s.name as stage_name,
          s.project_id,
          p.name as project_name,
          p.status as project_status,
          p.progress as project_progress,
          s.status as stage_status,
          json_group_array(
            json_object(
              'id', ta.agent_id,
              'name', a.name,
              'assignment_type', ta.assignment_type,
              'assigned_at', ta.assigned_at
            )
          ) as assigned_agents,
          json_group_array(
            json_object(
              'id', ah.id,
              'agent_id', ah.agent_id,
              'status', ah.status,
              'message', ah.message,
              'created_at', ah.created_at
            )
          ) as progress_history
        FROM tasks t
        LEFT JOIN stages s ON s.id = t.stage_id
        LEFT JOIN projects p ON p.id = s.project_id
        LEFT JOIN task_agents ta ON ta.task_id = t.id
        LEFT JOIN agents a ON a.id = ta.agent_id
        LEFT JOIN agent_status_history ah ON ah.task_id = t.id
        WHERE t.id = ?
        GROUP BY t.id
        `,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  }

  async findAllWithPagination(options = {}) {
    const { page = 1, limit = 20, project_id, stage_id, status, agent_id, priority, keyword } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        t.*,
        s.name as stage_name,
        p.name as project_name,
        COUNT(DISTINCT ta.agent_id) as assigned_agent_count
      FROM tasks t
      LEFT JOIN stages s ON s.id = t.stage_id
      LEFT JOIN projects p ON p.id = s.project_id
      LEFT JOIN task_agents ta ON ta.task_id = t.id
    `;
    
    const params = [];
    const conditions = [];

    if (project_id) {
      conditions.push('t.project_id = ?');
      params.push(project_id);
    }

    if (stage_id) {
      conditions.push('t.stage_id = ?');
      params.push(stage_id);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (keyword) {
      conditions.push('(t.name LIKE ? OR t.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 获取总数 - 使用自定义count查询
        this.countTasks({ project_id, stage_id, status, priority, keyword })
          .then(total => {
            resolve({
              list: rows,
              pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
              }
            });
          })
          .catch(reject);
      });
    });
  }

  // 自定义任务计数方法，支持keyword搜索
  async countTasks({ project_id, stage_id, status, priority, keyword }) {
    let sql = `
      SELECT COUNT(DISTINCT t.id) as total 
      FROM tasks t
      LEFT JOIN stages s ON s.id = t.stage_id
      LEFT JOIN projects p ON p.id = s.project_id
    `;
    
    const params = [];
    const conditions = [];

    if (project_id) {
      conditions.push('t.project_id = ?');
      params.push(project_id);
    }

    if (stage_id) {
      conditions.push('t.stage_id = ?');
      params.push(stage_id);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (keyword) {
      conditions.push('(t.name LIKE ? OR t.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ? row.total : 0);
      });
    });
  }

  async assignAgents(taskId, agentIds, assignmentType = 'primary') {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN');

        const insertPromises = agentIds.map((agentId) => {
          return new Promise((resolveInsert, rejectInsert) => {
            const taId = `ta_${taskId}_${agentId}`;
            this.db.run(
              `INSERT OR IGNORE INTO task_agents (id, task_id, agent_id, assignment_type) VALUES (?, ?, ?, ?)`,
              [taId, taskId, agentId, assignmentType],
              function (err) {
                if (err) {
                  rejectInsert(err);
                  return;
                }
                resolveInsert({ inserted: this.changes > 0, task_id: taskId, agent_id: agentId });
              }
            );
          });
        });

        Promise.all(insertPromises)
          .then((results) => {
            this.db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                reject(commitErr);
                return;
              }
              resolve({
                taskId,
                assignedAgents: results.filter(r => r.inserted).length,
                results
              });
            });
          })
          .catch((err) => {
            this.db.run('ROLLBACK');
            reject(err);
          });
      });
    });
  }

  async unassignAgent(taskId, agentId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM task_agents WHERE task_id = ? AND agent_id = ?`,
        [taskId, agentId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            taskId,
            agentId,
            removed: this.changes > 0
          });
        }
      );
    });
  }

  async updateProgress(taskId, progressData) {
    const { progress, message, output } = progressData;
    const taskIdUpdate = taskId;
    const taskUpdates = {};

    if (progress !== undefined) {
      taskUpdates.progress = progress;
      if (progress >= 100 && taskUpdates.status !== 'completed') {
        taskUpdates.status = 'completed';
        taskUpdates.completed_at = new Date().toISOString();
      }
    }

    if (message !== undefined) {
      taskUpdates.description = message;
    }

    const keys = Object.keys(taskUpdates);
    if (keys.length === 0) {
      return resolve({ taskId, message: 'No updates provided' });
    }

    return new Promise((resolve, reject) => {
      const setClause = keys.map((key) => `${key} = ?`).join(', ');
      const params = [...Object.values(taskUpdates), taskId];

      this.db.run(
        `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params,
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            taskId,
            affectedRows: this.changes,
            updates: taskUpdates
          });
        }
      );
    });
  }

  async getTaskProgress(taskId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          t.*,
          json_group_array(
            json_object(
              'agent_id', ta.agent_id,
              'name', a.name,
              'assignment_type', ta.assignment_type
            )
          ) as assigned_agents
        FROM tasks t
        LEFT JOIN task_agents ta ON ta.task_id = t.id
        LEFT JOIN agents a ON a.id = ta.agent_id
        WHERE t.id = ?
        GROUP BY t.id
        `,
        [taskId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            taskId,
            status: row?.status,
            progress: row?.progress,
            assignedAgents: row?.assigned_agents ? JSON.parse(row.assigned_agents) : [],
            startedAt: row?.started_at,
            completedAt: row?.completed_at
          });
        }
      );
    });
  }

  async getTasksByAgent(agentId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        t.*,
        s.name as stage_name,
        p.name as project_name,
        ta.assignment_type
      FROM tasks t
      LEFT JOIN stages s ON s.id = t.stage_id
      LEFT JOIN projects p ON p.id = s.project_id
      LEFT JOIN task_agents ta ON ta.task_id = t.id
      WHERE ta.agent_id = ?
    `;
    
    const params = [agentId];
    const conditions = [];

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
}

module.exports = TaskModel;
