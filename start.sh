#!/bin/bash
# OpenClaw Monitor 启动脚本

# 设置工作目录
cd "$(dirname "$0")"

# 启动后端服务
cd code/backend
npm start &

# 等待后端启动
sleep 3

# 启动前端服务
cd ../frontend
npm run dev &

# 等待所有后台任务
wait