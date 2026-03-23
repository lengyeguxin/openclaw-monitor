const { check } = require('express-validator');

// Agent Validators
const agentValidators = {
  create: [
    check('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('名称必须在2-50个字符之间'),
    check('category')
      .optional()
      .isIn(['product', 'engineering', 'design', 'test'])
      .withMessage('分类必须是 product/engineering/design/test'),
    check('capabilities')
      .optional()
      .isArray({ max: 20 })
      .withMessage('能力标签最多20个'),
    check('config')
      .optional()
      .isJSON()
      .withMessage('配置必须是有效的JSON对象')
  ],
  statusUpdate: [
    check('status')
      .isIn(['idle', 'running', 'error', 'offline'])
      .withMessage('状态必须是 idle/running/error/offline'),
    check('task_id')
      .optional()
      .isString()
      .withMessage('任务ID必须是字符串'),
    check('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('消息不能超过500个字符'),
    check('metadata')
      .optional()
      .isJSON()
      .withMessage('元数据必须是有效的JSON对象')
  ],
  statusReport: [
    check('status')
      .isIn(['idle', 'running', 'error', 'offline'])
      .withMessage('状态必须是 idle/running/error/offline'),
    check('current_task_id')
      .optional()
      .isString()
      .withMessage('当前任务ID必须是字符串'),
    check('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('消息不能超过500个字符'),
    check('progress')
      .optional()
      .isObject()
      .withMessage('进度必须是对象'),
    check('metrics')
      .optional()
      .isObject()
      .withMessage('指标必须是对象'),
    check('timestamp')
      .optional()
      .isISO8601()
      .withMessage('时间戳必须是有效的ISO8601格式')
  ],
  batchImport: [
    check('source')
      .isIn(['directory', 'file'])
      .withMessage('来源必须是 directory/file'),
    check('path')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('路径不能为空'),
    check('options')
      .optional()
      .isObject()
      .withMessage('选项必须是对象')
  ],
  id: [
    check('id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('智能体ID不能为空')
  ]
};

// Project Validators
const projectValidators = {
  create: [
    check('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('项目名称不能为空且不能超过100个字符'),
    check('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('描述不能超过1000个字符'),
    check('status')
      .optional()
      .isIn(['draft', 'active', 'completed', 'archived'])
      .withMessage('状态必须是 draft/active/completed/archived'),
    check('stages')
      .optional()
      .isArray()
      .withMessage('阶段必须是数组'),
    check('metadata')
      .optional()
      .isJSON()
      .withMessage('元数据必须是有效的JSON对象')
  ],
  update: [
    check('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('项目名称不能超过100个字符'),
    check('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('描述不能超过1000个字符'),
    check('status')
      .optional()
      .isIn(['draft', 'active', 'completed', 'archived'])
      .withMessage('状态必须是 draft/active/completed/archived'),
    check('metadata')
      .optional()
      .isJSON()
      .withMessage('元数据必须是有效的JSON对象')
  ],
  id: [
    check('id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('项目ID不能为空')
  ]
};

// Stage Validators
const stageValidators = {
  create: [
    check('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('阶段名称不能为空'),
    check('order')
      .optional()
      .isInt({ min: 1 })
      .withMessage('顺序必须是正整数'),
    check('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述不能超过500个字符'),
    check('prerequisites')
      .optional()
      .isArray()
      .withMessage('前置阶段必须是数组')
  ],
  update: [
    check('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('阶段名称不能超过100个字符'),
    check('order')
      .optional()
      .isInt({ min: 1 })
      .withMessage('顺序必须是正整数'),
    check('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述不能超过500个字符'),
    check('status')
      .optional()
      .isIn(['pending', 'active', 'completed', 'blocked'])
      .withMessage('状态必须是 pending/active/completed/blocked')
  ],
  id: [
    check('id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('阶段ID不能为空')
  ]
};

// Task Validators
const taskValidators = {
  create: [
    check('project_id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('项目ID不能为空'),
    check('stage_id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('阶段ID不能为空'),
    check('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('任务名称不能为空'),
    check('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('描述不能超过1000个字符'),
    check('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级必须是 low/medium/high/urgent'),
    check('estimated_hours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('预估工时必须是非负数'),
    check('assigned_agent_ids')
      .optional()
      .isArray()
      .withMessage('分配的智能体ID必须是数组'),
    check('dependencies')
      .optional()
      .isArray()
      .withMessage('依赖任务必须是数组')
  ],
  update: [
    check('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('任务名称不能超过200个字符'),
    check('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('描述不能超过1000个字符'),
    check('status')
      .optional()
      .isIn(['pending', 'running', 'completed', 'failed', 'cancelled'])
      .withMessage('状态必须是 pending/running/completed/failed/cancelled'),
    check('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级必须是 low/medium/high/urgent'),
    check('progress')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('进度必须是0-100的整数'),
    check('estimated_hours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('预估工时必须是非负数'),
    check('actual_hours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('实际工时必须是非负数'),
    check('dependencies')
      .optional()
      .isArray()
      .withMessage('依赖任务必须是数组')
  ],
  assign: [
    check('agent_ids')
      .isArray({ min: 1 })
      .withMessage('至少分配一个智能体'),
    check('agent_ids.*')
      .isString()
      .withMessage('智能体ID必须是字符串'),
    check('assignment_type')
      .optional()
      .isIn(['primary', 'secondary', 'observer'])
      .withMessage('分配类型必须是 primary/secondary/observer')
  ],
  id: [
    check('id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('任务ID不能为空')
  ],
  agentId: [
    check('agent_id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('智能体ID不能为空')
  ],
  progressReport: [
    check('agent_id')
      .trim()
      .isLength({ min: 1 })
      .withMessage('智能体ID不能为空'),
    check('progress')
      .isInt({ min: 0, max: 100 })
      .withMessage('进度必须是0-100的整数'),
    check('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('消息不能超过500个字符'),
    check('output')
      .optional()
      .isObject()
      .withMessage('输出必须是对象')
  ]
};

// Pagination Validators
const paginationValidators = {
  list: [
    check('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    check('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页条数必须是1-100的整数')
  ]
};

module.exports = {
  agentValidators,
  projectValidators,
  stageValidators,
  taskValidators,
  paginationValidators
};
