const BaseModel = require('./baseModel');
const { v4: uuidv4 } = require('uuid');

class AgentModel extends BaseModel {
  constructor(db) {
    super(db, 'agents');
  }

  async findByIdWithDetails(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          a.*,
          json_group_array(
            json_object(
              'id', ta.id,
              'agent_id', ta.agent_id,
              'assignment_type', ta.assignment_type,
              'assigned_at', ta.assigned_at
            )
          ) as task_assignments,
          json_group_array(
            json_object(
              'id', ts.id,
              'project_id', ts.project_id,
              'name', ts.name,
              'status', ts.status
            )
          ) as task_status_history
        FROM agents a
        LEFT JOIN task_agents ta ON ta.agent_id = a.id
        LEFT JOIN agent_status_history ts ON ts.agent_id = a.id
        WHERE a.id = ?
        GROUP BY a.id
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
    const { page = 1, limit = 20, status, category, keyword } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        a.*,
        COUNT(DISTINCT ta.id) as assigned_task_count,
        MAX(ts.created_at) as last_status_update
      FROM agents a
      LEFT JOIN task_agents ta ON ta.agent_id = a.id
      LEFT JOIN agent_status_history ts ON ts.agent_id = a.id
    `;
    
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('a.category = ?');
      params.push(category);
    }

    if (keyword) {
      conditions.push('(a.name LIKE ? OR a.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 获取总数（keyword不支持，只传status和category）
        const countWhere = {};
        if (status) countWhere.status = status;
        if (category) countWhere.category = category;
        this.count(countWhere)
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

  async countByStatus() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT status, COUNT(*) as count FROM agents GROUP BY status`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          const result = { idle: 0, running: 0, error: 0, offline: 0 };
          rows.forEach(row => {
            result[row.status] = row.count;
          });
          resolve(result);
        }
      );
    });
  }

  async updateStatus(id, statusData) {
    const { status, task_id, message, metadata } = statusData;
    const self = this;

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE agents SET status = ?, current_task_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, task_id || null, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          // 记录状态历史
          if (message || metadata) {
            const historyData = {
              id: `hist_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
              agent_id: id,
              status,
              task_id: task_id || null,
              message,
              metadata: metadata ? JSON.stringify(metadata) : null
            };

            self.db.run(
              `INSERT INTO agent_status_history (id, agent_id, status, task_id, message, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
              Object.values(historyData),
              (err) => {
                if (err) {
                  console.error('Failed to insert status history:', err);
                }
                resolve({ affectedRows: this.changes, id });
              }
            );
          } else {
            resolve({ affectedRows: this.changes, id });
          }
        }
      );
    });
  }

  async updateCurrentTask(id, taskId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE agents SET current_task_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [taskId || null, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ affectedRows: this.changes, id });
        }
      );
    });
  }

  async batchImport(agents) {
    const results = {
      imported: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const agent of agents) {
      try {
        const existing = await this.findById(agent.id);
        if (existing) {
          results.skipped++;
          results.details.push({
            name: agent.name,
            status: 'skipped',
            reason: 'Agent already exists'
          });
          continue;
        }

        const data = {
          id: agent.id,
          name: agent.name,
          description: agent.description || '',
          category: agent.category || '',
          status: agent.status || 'idle',
          capabilities: agent.capabilities ? JSON.stringify(agent.capabilities) : null,
          config: agent.config ? JSON.stringify(agent.config) : null,
          current_task_id: agent.current_task_id || null
        };

        await this.create(data);
        results.imported++;
        results.details.push({
          name: agent.name,
          status: 'success',
          agent_id: agent.id
        });
      } catch (err) {
        results.failed++;
        results.details.push({
          name: agent.name || 'Unknown',
          status: 'failed',
          reason: err.message
        });
      }
    }

    return results;
  }
}

module.exports = AgentModel;
