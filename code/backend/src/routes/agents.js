const express = require('express');
const router = express.Router();
const AgentService = require('../services/agentService');
const {
  agentValidators,
  paginationValidators
} = require('../middleware/validators');
const { validationHandler } = require('../middleware/errorHandler');

// 获取数据库实例（延迟初始化）
const db = require('../config/database');
let agentService;
function getAgentService() {
  if (!agentService) {
    agentService = new AgentService(db.getDb());
  }
  return agentService;
}

// GET /api/v1/agents - 获取智能体列表
router.get('/', paginationValidators.list, validationHandler, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, keyword } = req.query;
    const options = { page: parseInt(page), limit: parseInt(limit), status, category, keyword };
    
    const result = await getAgentService().getAgents(options);
    res.json({ code: 0, data: result, message: '获取成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/agents - 创建智能体
router.post('/', agentValidators.create, validationHandler, async (req, res) => {
  try {
    const agent = await getAgentService().createAgent(req.body);
    res.status(201).json({ code: 0, data: agent, message: '创建成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/agents/batch-import - 批量导入智能体
router.post('/batch-import', async (req, res) => {
  try {
    const { source, path, options = {} } = req.body;
    
    if (source === 'directory') {
      // 简化实现，实际应该递归读取目录
      res.status(501).json({ code: 50100, error: { message: '目录扫描功能未实现' } });
      return;
    }

    // 从文件导入
    const result = await getAgentService().batchImport([]);
    res.json({ code: 0, data: result, message: '批量导入完成' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// GET /api/v1/agents/:id - 获取智能体详情
router.get('/:id', agentValidators.id, validationHandler, async (req, res) => {
  try {
    const agent = await getAgentService().getAgentById(req.params.id);
    res.json({ code: 0, data: agent, message: '获取成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// PATCH /api/v1/agents/:id/status - 更新智能体状态
router.patch('/:id/status', agentValidators.statusUpdate, validationHandler, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, task_id, message, metadata } = req.body;
    
    const agent = await getAgentService().updateAgentStatus(id, {
      status,
      task_id,
      message,
      metadata
    });
    res.json({ code: 0, data: agent, message: '状态更新成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// POST /api/v1/agents/:id/status-report - 智能体状态上报
router.post('/:id/status-report', agentValidators.statusReport, validationHandler, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, current_task_id, message, progress, metrics, timestamp } = req.body;
    
    // 更新智能体状态
    await getAgentService().updateAgentStatus(id, { status, task_id: current_task_id, message });
    
    // 更新当前任务关联
    if (current_task_id) {
      await getAgentService().updateAgentCurrentTask(id, current_task_id);
    }
    
    res.json({ 
      code: 0, 
      data: { 
        received: true, 
        recorded_at: new Date().toISOString() 
      }, 
      message: '状态上报成功' 
    });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

module.exports = router;
