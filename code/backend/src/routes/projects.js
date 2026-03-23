const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');
const { projectValidators, paginationValidators } = require('../middleware/validators');
const { validationHandler } = require('../middleware/errorHandler');

// GET /api/v1/projects - 获取项目列表
router.get('/', paginationValidators.list, validationHandler, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const options = { page, limit, status, keyword };
    
    const result = await projectService.getProjects(options);
    res.json({ code: 0, data: result, message: '获取成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// POST /api/v1/projects - 创建项目
router.post('/', projectValidators.create, validationHandler, async (req, res) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ code: 0, data: project, message: '创建成功' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ code: err.code || 50000, error: { message: err.message } });
  }
});

// GET /api/v1/projects/:id - 获取项目详情
router.get('/:id', projectValidators.id, validationHandler, async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json({ code: 0, data: project, message: '获取成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// PUT /api/v1/projects/:id - 更新项目
router.put('/:id', projectValidators.update, validationHandler, async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json({ code: 0, data: project, message: '更新成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

// DELETE /api/v1/projects/:id - 删除项目
router.delete('/:id', projectValidators.id, validationHandler, async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.json({ code: 0, data: result, message: '删除成功' });
  } catch (err) {
    res.status(404).json({ code: 40002, error: { message: err.message } });
  }
});

module.exports = router;
