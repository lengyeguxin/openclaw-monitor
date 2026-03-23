const AgentModel = require('../models/agentModel');
const { validate } = require('uuid');

class AgentService {
  constructor(db) {
    this.model = new AgentModel(db);
  }

  async getAgents(options) {
    return await this.model.findAllWithPagination(options);
  }

  async getAgentById(id) {
    const agent = await this.model.findByIdWithDetails(id);
    if (!agent) {
      throw { statusCode: 404, message: '智能体不存在' };
    }
    return agent;
  }

  async createAgent(data) {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const agentData = {
      id,
      name: data.name,
      description: data.description || '',
      category: data.category || '',
      status: data.status || 'idle',
      capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null,
      config: data.config ? JSON.stringify(data.config) : null,
      current_task_id: null
    };

    const result = await this.model.create(agentData);
    return {
      id: result.id,
      name: result.name,
      status: result.status,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  async updateAgentStatus(id, statusData) {
    const agent = await this.model.findById(id);
    if (!agent) {
      throw { statusCode: 404, message: '智能体不存在' };
    }

    const result = await this.model.updateStatus(id, statusData);
    return {
      id,
      status: statusData.status,
      updated_at: new Date().toISOString()
    };
  }

  async updateAgentCurrentTask(id, taskId) {
    const agent = await this.model.findById(id);
    if (!agent) {
      throw { statusCode: 404, message: '智能体不存在' };
    }

    await this.model.updateCurrentTask(id, taskId);
    return { id, current_task_id: taskId };
  }

  async batchImport(agents) {
    // 预处理智能体数据
    const processedAgents = agents.map(agent => ({
      id: agent.id || `agent_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      name: agent.name,
      description: agent.description || '',
      category: agent.category || '',
      status: agent.status || 'idle',
      capabilities: agent.capabilities || [],
      config: agent.config || null,
      current_task_id: agent.current_task_id || null
    }));

    return await this.model.batchImport(processedAgents);
  }
}

module.exports = AgentService;
