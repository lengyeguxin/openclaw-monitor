const StageModel = require('../models/stageModel');

class StageService {
  constructor(db) {
    this.model = new StageModel(db);
  }

  async getProjectStages(projectId, options) {
    const stages = await this.model.findByProjectId(projectId, options);
    return stages;
  }

  async createStage(projectId, data) {
    // 获取项目以验证存在
    const project = await this.model.db.get(
      `SELECT id FROM projects WHERE id = ?`,
      [projectId]
    );
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }

    const id = `stage_${projectId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const stageData = {
      id,
      project_id: projectId,
      name: data.name,
      order: data.order || 999,
      description: data.description || '',
      status: data.status || 'pending',
      prerequisites: data.prerequisites ? JSON.stringify(data.prerequisites) : null,
      task_count: 0,
      completed_task_count: 0
    };

    await this.model.create(stageData);
    return {
      id,
      project_id: projectId,
      name: data.name,
      order: stageData.order,
      status: 'pending',
      created_at: stageData.created_at
    };
  }

  async updateStage(id, data) {
    const stage = await this.model.findById(id);
    if (!stage) {
      throw { statusCode: 404, message: '阶段不存在' };
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.prerequisites !== undefined) updateData.prerequisites = JSON.stringify(data.prerequisites);

    if (Object.keys(updateData).length > 0) {
      await this.model.update(id, updateData);
    }

    return await this.model.findById(id);
  }

  async checkPrerequisites(stageId) {
    const stage = await this.model.findById(stageId);
    if (!stage) {
      throw { statusCode: 404, message: '阶段不存在' };
    }

    const prerequisites = stage.prerequisites ? JSON.parse(stage.prerequisites) : [];
    return await this.model.checkPrerequisites(stageId, prerequisites);
  }

  async updateStageProgress(stageId) {
    const stage = await this.model.findById(stageId);
    if (!stage) {
      throw { statusCode: 404, message: '阶段不存在' };
    }

    const progress = await this.model.getStageProgress(stageId);
    await this.model.updateStatusAndCount(stageId, {
      task_count: progress.taskCount,
      completed_task_count: progress.completedTaskCount
    });

    return {
      stageId,
      ...progress
    };
  }
}

module.exports = StageService;
