@echo off
echo ========================================
echo PaperMaker 项目启动脚本 (含Swagger)
echo ========================================
echo.

echo 正在启动PaperMaker项目...
echo.
echo 项目启动后，可以通过以下地址访问：
echo - 应用主页: http://localhost:8080
echo - Swagger UI: http://localhost:8080/swagger-ui.html
echo - API文档JSON: http://localhost:8080/v3/api-docs
echo.

echo 按任意键启动项目...
pause > nul

echo 启动中...
mvn spring-boot:run

echo.
echo 项目已停止运行
pause

