@echo off
echo ========================================
echo OL前端项目启动脚本 (含认证功能)
echo ========================================
echo.

echo 正在启动OL前端项目...
echo.
echo 项目启动后，可以通过以下地址访问：
echo - 登录页面: http://localhost:5173/login
echo - 注册页面: http://localhost:5173/register
echo - 系统首页: http://localhost:5173/ (需要登录)
echo.
echo 测试账户:
echo - 用户名: admin
echo - 密码: admin123
echo.

echo 按任意键启动项目...
pause > nul

echo 启动中...
npm run dev

echo.
echo 项目已停止运行
pause

