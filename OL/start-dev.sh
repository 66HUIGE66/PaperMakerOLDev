#!/bin/bash

echo "启动智能组卷刷题系统开发环境..."

echo ""
echo "1. 启动后端服务..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

echo ""
echo "2. 等待后端启动完成..."
sleep 10

echo ""
echo "3. 启动前端服务..."
cd ..
npm run dev

# 清理后台进程
trap "kill $BACKEND_PID" EXIT















