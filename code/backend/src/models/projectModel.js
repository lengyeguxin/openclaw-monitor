const BaseModel = require('./baseModel');

class ProjectModel extends BaseModel {
  constructor(db) {
    super(db, 'projects');
  }

  async findByIdWithDetails(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          p.*,
          s.id as stage_id,
          s.name as stage_name,
          s.status as stage_status,
          COUNT(DISTINCT t.id) as task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count
        FROM projects p
        LEFT JOIN stages s ON s.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.id = ?
        GROUP BY p.id
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
    const { page = 1, limit = 20, status, keyword } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.*,
        COUNT(DISTINCT s.id) as stage_count,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count,
        COALESCE(ROUND(COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) * 100.0 / NULLIF(COUNT(DISTINCT t.id), 0), 0), 0) as progress
      FROM projects p
      LEFT JOIN stages s ON s.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
    `;
    
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (keyword) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 获取总数（keyword不支持，只传status）
        const countWhere = {};
        if (status) countWhere.status = status;
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

  async updateProgress(projectId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          COUNT(DISTINCT t.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
        FROM tasks t
        WHERE t.project_id = ?
        `,
        [projectId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          const progress = row.total_tasks > 0 
            ? Math.round((row.completed_tasks / row.total_tasks) * 100)
            : 0;

          this.db.run(
            `UPDATE projects SET progress = ? WHERE id = ?`,
            [progress, projectId],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ projectId, progress });
            }
          );
        }
      );
    });
  }

  async createWithStages(projectData, stages) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 创建项目
        const project = {
          id: projectData.id,
          name: projectData.name,
          description: projectData.description || '',
          status: projectData.status || 'draft',
          current_stage_id: null,
          progress: 0,
          metadata: projectData.metadata ? JSON.stringify(projectData.metadata) : null
        };

        this.create(project)
          .then((createdProject) => {
            // 创建阶段
            const stagePromises = (stages || []).map((stage, index) => {
              const stageData = {
                id: stage.id || `stage_${createdProject.id}_${index + 1}`,
                project_id: createdProject.id,
                name: stage.name,
                order: stage.order || index + 1,
                description: stage.description || '',
                status: 'pending',
                prerequisites: stage.prerequisites ? JSON.stringify(stage.prerequisites) : null,
                task_count: 0,
                completed_task_count: 0
              };
              return new Promise((resolveStage, rejectStage) => {
                this.db.run(
                  `INSERT INTO stages (id, project_id, name, "order", description, status, prerequisites, task_count, completed_task_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  Object.values(stageData),
                  function (err) {
                    if (err) {
                      rejectStage(err);
                      return;
                    }
                    resolveStage({ id: this.lastID, ...stageData });
                  }
                );
              });
            });

            Promise.all(stagePromises)
              .then((createdStages) => {
                resolve({
                  project: createdProject,
                  stages: createdStages
                });
              })
              .catch(rejectStage);
          })
          .catch(reject);
      });
    });
  }
}

module.exports = ProjectModel;
