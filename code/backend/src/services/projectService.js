const ProjectModel = require('../models/projectModel');
const StageModel = require('../models/stageModel');

class ProjectService {
  constructor(db) {
    this.model = new ProjectModel(db);
    this.stageModel = new StageModel(db);
  }

  async getProjects(options) {
    return await this.model.findAllWithPagination(options);
  }

  async getProjectById(id) {
    const project = await this.model.findByIdWithDetails(id);
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }
    return project;
  }

  async createProject(data) {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const projectData = {
      id,
      name: data.name,
      description: data.description || '',
      status: data.status || 'draft',
      metadata: data.metadata || null
    };

    const result = await this.model.createWithStages(projectData, data.stages);
    
    // 计算初始进度
    await this.model.updateProgress(id);
    
    const project = await this.model.findByIdWithDetails(id);
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      current_stage: project.current_stage_id,
      progress: project.progress,
      created_at: project.created_at,
      updated_at: project.updated_at
    };
  }

  async updateProject(id, data) {
    const project = await this.model.findById(id);
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

    await this.model.update(id, updateData);
    return await this.model.findById(id);
  }

  async deleteProject(id) {
    const project = await this.model.findById(id);
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }

    await this.model.delete(id);
    return { deleted: true };
  }

  async updateProjectProgress(id) {
    const project = await this.model.findById(id);
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }
    return await this.model.updateProgress(id);
  }

  async getProjectStages(projectId, options) {
    const project = await this.model.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }
    return await this.stageModel.findByProjectId(projectId, options);
  }
}

module.exports = ProjectService;
