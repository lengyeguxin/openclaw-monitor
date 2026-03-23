const Database = require('../models/database');

const DB_PATH = '/home/my/.openclaw/ai-project/openclaw-monitor/data/monitor.db';
const db = new Database(DB_PATH);

module.exports = db;
