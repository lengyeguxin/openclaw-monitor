const BaseModel = require('./baseModel');

class StageModel extends BaseModel {
  constructor(db) {
    super(db, 'stages');
  }

  async findByProjectId(projectId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    return new Promise((resolve, reject) => {
      // 获取阶段列表
      this.db.all(
        `
        SELECT 
          s.*,
          COUNT(DISTINCT t.id) as task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count
        FROM stages s
        LEFT JOIN tasks t ON t.stage_id = s.id
        WHERE s.project_id = ?
        GROUP BY s.id
        ORDER BY s."order" ASC
        LIMIT ? OFFSET ?
        `,
        [projectId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(rows);
        }
      );
    });
  }

  async updateStatusAndCount(stageId, updates) {
    const { status, task_count, completed_task_count } = updates;

    return new Promise((resolve, reject) => {
      // 使用事务确保数据一致性
      this.db.serialize(() => {
        this.db.run('BEGIN');

        const updatesObj = {};
        if (status !== undefined) updatesObj.status = status;
        if (task_count !== undefined) updatesObj.task_count = task_count;
        if (completed_task_count !== undefined) updatesObj.completed_task_count = completed_task_count;

        const keys = Object.keys(updatesObj);
        if (keys.length > 0) {
          const setClause = keys.map((key) => `${key} = ?`).join(', ');
          const params = [...Object.values(updatesObj), stageId];

          this.db.run(
            `UPDATE stages SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params,
            function (err) {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }

              this.db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  reject(commitErr);
                  return;
                }
                resolve({ affectedRows: this.changes, id: stageId });
              });
            }
          );
        } else {
          this.db.run('ROLLBACK');
          resolve({ affectedRows: 0, id: stageId });
        }
      });
    });
  }

  async checkPrerequisites(stageId, prereqStageIds) {
    return new Promise((resolve, reject) => {
      if (!prereqStageIds || prereqStageIds.length === 0) {
        resolve({ allCompleted: true, message: 'No prerequisites' });
        return;
      }

      this.db.get(
        `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM stages
        WHERE id IN (${prereqStageIds.map(() => '?').join(', ')})
        `,
        prereqStageIds,
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            allCompleted: row.completed === row.total,
            completed: row.completed,
            total: row.total,
            message: row.completed === row.total 
              ? 'All prerequisites completed' 
              : `${row.total - row.completed} prerequisites not completed`
          });
        }
      );
    });
  }

  async getStageProgress(stageId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          s.task_count,
          s.completed_task_count,
          CASE 
            WHEN s.task_count = 0 THEN 0
            ELSE ROUND(s.completed_task_count * 100.0 / s.task_count, 0)
          END as progress
        FROM stages s
        WHERE s.id = ?
        `,
        [stageId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            stageId,
            taskCount: row?.task_count || 0,
            completedTaskCount: row?.completed_task_count || 0,
            progress: row?.progress || 0
          });
        }
      );
    });
  }
}

module.exports = StageModel;
