const express = require('express');
const router = express.Router();
const StageService = require('../services/stageService');
const { stageValidators } = require('../middleware/validators');
const { validationHandler } = require('../middleware/errorHandler');

// 获取数据库实例（延迟初始化）
const db = require('../config/database');
let stageService;
function getStageService() {
  if (!stageService) {
    stageService = new StageService(db.getDb());
  }
  return stageService;
}

// GET /api/v1/projects/:project_id/stages - 获取阶段列表
router.get('/:project_id/stages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const stages = await getStageService().getProjectStages(req.params.project_id, { page: parseInt(page), limit: parseInt(limit) });
    res.json({ code: 0, data: { list: stages }, message: '获取成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// POST /api/v1/projects/:project_id/stages - 创建阶段
router.post('/:project_id/stages', stageValidators.create, validationHandler, async (req, res) => {
  try {
    const stage = await getStageService().createStage(req.params.project_id, req.body);
    res.status(201).json({ code: 0, data: stage, message: '创建成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// PUT /api/v1/stages/:id - 更新阶段
router.put('/:id', stageValidators.update, validationHandler, async (req, res) => {
  try {
    const stage = await getStageService().updateStage(req.params.id, req.body);
    res.json({ code: 0, data: stage, message: '更新成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

module.exports = router;
