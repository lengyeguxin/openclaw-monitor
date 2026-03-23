const TaskModel = require('../models/taskModel');

class TaskService {
  constructor(db) {
    this.model = new TaskModel(db);
  }

  async getTasks(options) {
    return await this.model.findAllWithPagination(options);
  }

  async getTaskById(id) {
    const task = await this.model.findByIdWithDetails(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }
    return task;
  }

  async createTask(data) {
    // 验证项目和阶段存在
    const project = await this.model.db.get(
      `SELECT id FROM projects WHERE id = ?`,
      [data.project_id]
    );
    if (!project) {
      throw { statusCode: 404, message: '项目不存在' };
    }

    const stage = await this.model.db.get(
      `SELECT id, project_id FROM stages WHERE id = ?`,
      [data.stage_id]
    );
    if (!stage) {
      throw { statusCode: 404, message: '阶段不存在' };
    }

    if (stage.project_id !== data.project_id) {
      throw { statusCode: 400, message: '阶段不属于指定项目' };
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const taskData = {
      id,
      project_id: data.project_id,
      stage_id: data.stage_id,
      name: data.name,
      description: data.description || '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      progress: 0,
      estimated_hours: data.estimated_hours || null,
      actual_hours: null,
      dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
      started_at: null,
      completed_at: null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    };

    await this.model.create(taskData);

    // 分配智能体
    if (data.assigned_agent_ids && data.assigned_agent_ids.length > 0) {
      await this.model.assignAgents(
        id,
        data.assigned_agent_ids,
        data.assignment_type || 'primary'
      );
    }

    return {
      id,
      project_id: data.project_id,
      stage_id: data.stage_id,
      name: data.name,
      status: 'pending',
      priority: taskData.priority,
      created_at: taskData.created_at
    };
  }

  async updateTask(id, data) {
    const task = await this.model.findById(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.estimated_hours !== undefined) updateData.estimated_hours = data.estimated_hours;
    if (data.actual_hours !== undefined) updateData.actual_hours = data.actual_hours;
    if (data.dependencies !== undefined) updateData.dependencies = JSON.stringify(data.dependencies);
    if (data.started_at !== undefined) updateData.started_at = data.started_at;
    if (data.completed_at !== undefined) updateData.completed_at = data.completed_at;
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

    if (Object.keys(updateData).length > 0) {
      await this.model.update(id, updateData);
    }

    return await this.model.findById(id);
  }

  async assignTask(id, agentIds, assignmentType = 'primary') {
    const task = await this.model.findById(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }

    return await this.model.assignAgents(id, agentIds, assignmentType);
  }

  async unassignAgent(id, agentId) {
    const task = await this.model.findById(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }

    return await this.model.unassignAgent(id, agentId);
  }

  async updateTaskProgress(id, progressData) {
    const task = await this.model.findById(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }

    return await this.model.updateProgress(id, progressData);
  }

  async getTaskByAgent(agentId, options) {
    const agents = await this.model.db.get(
      `SELECT id FROM agents WHERE id = ?`,
      [agentId]
    );
    if (!agents) {
      throw { statusCode: 404, message: '智能体不存在' };
    }

    return await this.model.getTasksByAgent(agentId, options);
  }

  async rollbackTask(id) {
    const task = await this.model.findById(id);
    if (!task) {
      throw { statusCode: 404, message: '任务不存在' };
    }

    // 只有已完成的任务才能回滚
    if (task.status !== 'completed') {
      throw { statusCode: 400, message: '只有已完成的任务可以回滚' };
    }

    await this.model.update(id, {
      status: 'pending',
      progress: 0,
      started_at: null,
      completed_at: null
    });

    return await this.model.findById(id);
  }
}

module.exports = TaskService;
