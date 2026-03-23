const express = require('express');
const router = express.Router();

// 导入路由模块
const agentsRoute = require('./agents');
const projectsRoute = require('./projects');
const stagesRoute = require('./stages');
const tasksRoute = require('./tasks');

// 挂载路由
router.use('/agents', agentsRoute);
router.use('/projects', projectsRoute);
router.use('/stages', stagesRoute);
router.use('/tasks', tasksRoute);

// API 概览
router.get('/', (req, res) => {
  res.json({
    name: 'OpenClaw Monitor API',
    version: 'v1',
    basePath: '/api/v1',
    endpoints: {
      agents: {
        list: 'GET /api/v1/agents',
        create: 'POST /api/v1/agents',
        detail: 'GET /api/v1/agents/:id',
        status: 'PATCH /api/v1/agents/:id/status',
        report: 'POST /api/v1/agents/:id/status-report',
        batchImport: 'POST /api/v1/agents/batch-import'
      },
      projects: {
        list: 'GET /api/v1/projects',
        create: 'POST /api/v1/projects',
        detail: 'GET /api/v1/projects/:id',
        update: 'PUT /api/v1/projects/:id',
        delete: 'DELETE /api/v1/projects/:id'
      },
      stages: {
        list: 'GET /api/v1/projects/:project_id/stages',
        create: 'POST /api/v1/projects/:project_id/stages',
        update: 'PUT /api/v1/stages/:id'
      },
      tasks: {
        list: 'GET /api/v1/tasks',
        create: 'POST /api/v1/tasks',
        detail: 'GET /api/v1/tasks/:id',
        update: 'PUT /api/v1/tasks/:id',
        assign: 'POST /api/v1/tasks/:id/assign',
        unassign: 'DELETE /api/v1/tasks/:id/agents/:agent_id',
        report: 'POST /api/v1/tasks/:id/progress-report'
      }
    }
  });
});

module.exports = router;
