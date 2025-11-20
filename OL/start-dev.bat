@echo off
echo 启动智能组卷刷题系统开发环境...

echo.
echo 1. 启动后端服务...
cd backend
start cmd /k "mvn spring-boot:run"

echo.
echo 2. 等待后端启动完成...
timeout /t 10 /nobreak

echo.
echo 3. 启动前端服务...
cd ..
npm run dev

pause















