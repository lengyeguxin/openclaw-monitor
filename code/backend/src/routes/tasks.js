const express = require('express');
const router = express.Router();
const TaskService = require('../services/taskService');
const AgentService = require('../services/agentService');
const { taskValidators, paginationValidators } = require('../middleware/validators');
const { validationHandler } = require('../middleware/errorHandler');

// 获取数据库实例（延迟初始化）
const db = require('../config/database');
let taskService;
let agentService;
function getTaskService() {
  if (!taskService) {
    taskService = new TaskService(db.getDb());
  }
  return taskService;
}
function getAgentService() {
  if (!agentService) {
    agentService = new AgentService(db.getDb());
  }
  return agentService;
}

// GET /api/v1/tasks - 获取任务列表
router.get('/', paginationValidators.list, validationHandler, async (req, res) => {
  try {
    const { page = 1, limit = 20, project_id, stage_id, status, agent_id, priority, keyword } = req.query;
    const options = { page: parseInt(page), limit: parseInt(limit), project_id, stage_id, status, agent_id, priority, keyword };
    
    const result = await getTaskService().getTasks(options);
    res.json({ code: 0, data: result, message: '获取成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/tasks - 创建任务
router.post('/', taskValidators.create, validationHandler, async (req, res) => {
  try {
    const task = await getTaskService().createTask(req.body);
    res.status(201).json({ code: 0, data: task, message: '创建成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// GET /api/v1/tasks/:id - 获取任务详情
router.get('/:id', taskValidators.id, validationHandler, async (req, res) => {
  try {
    const task = await getTaskService().getTaskById(req.params.id);
    res.json({ code: 0, data: task, message: '获取成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// PUT /api/v1/tasks/:id - 更新任务
router.put('/:id', taskValidators.update, validationHandler, async (req, res) => {
  try {
    const task = await getTaskService().updateTask(req.params.id, req.body);
    res.json({ code: 0, data: task, message: '更新成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/tasks/:id/assign - 分配智能体到任务
router.post('/:id/assign', taskValidators.assign, validationHandler, async (req, res) => {
  try {
    const { agent_ids, assignment_type = 'primary' } = req.body;
    const task = await getTaskService().assignAgents(req.params.id, agent_ids, assignment_type);
    res.json({ code: 0, data: task, message: '分配成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// DELETE /api/v1/tasks/:id/agents/:agent_id - 移除智能体分配
router.delete('/:id/agents/:agent_id', async (req, res) => {
  try {
    const task = await getTaskService().unassignAgent(req.params.id, req.params.agent_id);
    res.json({ code: 0, data: task, message: '移除成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/tasks/:id/progress-report - 任务进度上报
router.post('/:id/progress-report', taskValidators.progressReport, validationHandler, async (req, res) => {
  try {
    const { agent_id, progress, message, output } = req.body;
    const result = await getTaskService().reportProgress(req.params.id, agent_id, { progress, message, output });
    res.json({ code: 0, data: result, message: '进度上报成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

module.exports = router;
